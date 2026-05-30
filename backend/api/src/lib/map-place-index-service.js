import { withMapDbClient } from "./map-db.js";

function normalizeLimit(limit, fallback = 6) {
  const parsed = Number.parseInt(String(limit ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(parsed, 12));
}

function toNumberOrNull(value) {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function buildDistanceBoostSql() {
  return `
    CASE
      WHEN input.lat IS NULL OR input.lng IS NULL THEN 0
      ELSE CASE
        WHEN (
          6371000 * 2 * asin(
            sqrt(
              power(sin(radians(places.latitude - input.lat) / 2), 2) +
              cos(radians(input.lat)) *
              cos(radians(places.latitude)) *
              power(sin(radians(places.longitude - input.lng) / 2), 2)
            )
          )
        ) < 1500 THEN 120
        WHEN (
          6371000 * 2 * asin(
            sqrt(
              power(sin(radians(places.latitude - input.lat) / 2), 2) +
              cos(radians(input.lat)) *
              cos(radians(places.latitude)) *
              power(sin(radians(places.longitude - input.lng) / 2), 2)
            )
          )
        ) < 5000 THEN 75
        WHEN (
          6371000 * 2 * asin(
            sqrt(
              power(sin(radians(places.latitude - input.lat) / 2), 2) +
              cos(radians(input.lat)) *
              cos(radians(places.latitude)) *
              power(sin(radians(places.longitude - input.lng) / 2), 2)
            )
          )
        ) < 15000 THEN 35
        ELSE 0
      END
    END
  `;
}

function mapRowToSuggestion(row) {
  return {
    id: String(row.place_id),
    label: String(row.display_name),
    displayName: String(row.display_name),
    shortName: String(row.short_name || row.name || row.display_name),
    lat: toNumberOrNull(row.latitude),
    lng: toNumberOrNull(row.longitude),
    source: "place-index",
    kind: typeof row.kind === "string" ? row.kind : null,
  };
}

export async function searchPlaceIndexPlaces({ query, limit = 6, proximity = null }) {
  const normalizedLimit = normalizeLimit(limit);
  const lat = proximity ? toNumberOrNull(proximity.lat) : null;
  const lng = proximity ? toNumberOrNull(proximity.lng) : null;
  const distanceBoostSql = buildDistanceBoostSql();

  const rows = await withMapDbClient(async (client) => {
    const result = await client.query(
      `
        WITH input AS (
          SELECT
            map_index.normalize_text($1) AS query,
            $2::integer AS limit_value,
            $3::double precision AS lat,
            $4::double precision AS lng
        ),
        scored AS (
          SELECT
            places.place_id,
            places.kind,
            places.name,
            places.short_name,
            places.display_name,
            places.latitude,
            places.longitude,
            places.importance,
            (
              (places.importance * 100)
              + CASE
                  WHEN places.search_text = input.query THEN 1100
                  WHEN places.search_text LIKE input.query || '%' THEN 420
                  WHEN places.search_text LIKE '%' || input.query || '%' THEN 180
                  ELSE 0
                END
              + CASE
                  WHEN places.search_text % input.query THEN similarity(places.search_text, input.query) * 220
                  ELSE 0
                END
              + COALESCE(alias_match.alias_score, 0)
              + ${distanceBoostSql}
            ) AS score
          FROM map_index.places AS places
          CROSS JOIN input
          LEFT JOIN LATERAL (
            SELECT MAX(
              CASE
                WHEN aliases.normalized_alias = input.query THEN 720
                WHEN aliases.normalized_alias LIKE input.query || '%' THEN 260
                WHEN aliases.normalized_alias LIKE '%' || input.query || '%' THEN 110
                ELSE 0
              END
              + CASE
                  WHEN aliases.normalized_alias % input.query THEN similarity(aliases.normalized_alias, input.query) * 180
                  ELSE 0
                END
            ) AS alias_score
            FROM map_index.place_aliases AS aliases
            WHERE aliases.place_id = places.place_id
          ) AS alias_match ON true
          WHERE input.query <> ''
            AND (
              places.search_text % input.query
              OR places.search_text LIKE '%' || input.query || '%'
              OR EXISTS (
                SELECT 1
                FROM map_index.place_aliases AS aliases
                WHERE aliases.place_id = places.place_id
                  AND (
                    aliases.normalized_alias % input.query
                    OR aliases.normalized_alias LIKE '%' || input.query || '%'
                  )
              )
            )
        )
        SELECT
          place_id,
          kind,
          name,
          short_name,
          display_name,
          latitude,
          longitude
        FROM scored
        ORDER BY score DESC, importance DESC, display_name ASC
        LIMIT (SELECT limit_value FROM input)
      `,
      [query, normalizedLimit, lat, lng],
    );
    return result.rows;
  });

  return rows.map(mapRowToSuggestion).filter((item) => item.lat != null && item.lng != null);
}

export async function reversePlaceIndexPlace({ lat, lng, maxDistanceMeters = 650 }) {
  const latitude = toNumberOrNull(lat);
  const longitude = toNumberOrNull(lng);
  const radiusMeters = toNumberOrNull(maxDistanceMeters) ?? 650;
  if (latitude == null || longitude == null) {
    return null;
  }

  const latitudeDelta = radiusMeters / 111320;
  const cosine = Math.max(Math.cos((latitude * Math.PI) / 180), 0.25);
  const longitudeDelta = radiusMeters / (111320 * cosine);

  const row = await withMapDbClient(async (client) => {
    const result = await client.query(
      `
        WITH input AS (
          SELECT
            $1::double precision AS lat,
            $2::double precision AS lng,
            $3::double precision AS radius_meters,
            $4::double precision AS lat_delta,
            $5::double precision AS lng_delta
        ),
        candidates AS (
          SELECT
            places.place_id,
            places.kind,
            places.name,
            places.short_name,
            places.display_name,
            places.latitude,
            places.longitude,
            places.importance,
            (
              6371000 * 2 * asin(
                sqrt(
                  power(sin(radians(places.latitude - input.lat) / 2), 2) +
                  cos(radians(input.lat)) *
                  cos(radians(places.latitude)) *
                  power(sin(radians(places.longitude - input.lng) / 2), 2)
                )
              )
            ) AS distance_meters
          FROM map_index.places AS places
          CROSS JOIN input
          WHERE places.latitude BETWEEN input.lat - input.lat_delta AND input.lat + input.lat_delta
            AND places.longitude BETWEEN input.lng - input.lng_delta AND input.lng + input.lng_delta
        )
        SELECT
          place_id,
          kind,
          name,
          short_name,
          display_name,
          latitude,
          longitude,
          distance_meters
        FROM candidates
        WHERE distance_meters <= (SELECT radius_meters FROM input)
        ORDER BY distance_meters ASC, importance DESC, display_name ASC
        LIMIT 1
      `,
      [latitude, longitude, radiusMeters, latitudeDelta, longitudeDelta],
    );
    return result.rows[0] ?? null;
  });

  return row ? mapRowToSuggestion(row) : null;
}
