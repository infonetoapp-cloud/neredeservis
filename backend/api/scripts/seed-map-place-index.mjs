import { BOOTSTRAP_PLACES } from "../src/lib/map-bootstrap-places.js";
import { closeMapDbPool, withMapDbClient } from "../src/lib/map-db.js";

function inferPlaceKind(place) {
  if (place.id.startsWith("district-")) {
    return "district";
  }
  if (place.id.startsWith("poi-")) {
    return "poi";
  }
  return "place";
}

function inferMunicipality(place) {
  const label = String(place.label ?? "");
  const segments = label
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length >= 2) {
    return segments[segments.length - 1];
  }

  return null;
}

function inferDistrict(place) {
  const label = String(place.label ?? "");
  const segments = label
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length >= 2) {
    return segments[segments.length - 2];
  }

  return place.shortName ?? place.name ?? null;
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr")
    .replaceAll("ç", "c")
    .replaceAll("ğ", "g")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ş", "s")
    .replaceAll("ü", "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPlaceSearchText(place) {
  return normalizeSearchText(
    [
      place.name,
      place.shortName,
      place.label,
      inferMunicipality(place),
      inferDistrict(place),
    ].join(" "),
  );
}

async function seedBootstrapPlaces() {
  await withMapDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      for (const place of BOOTSTRAP_PLACES) {
        await client.query(
          `
            INSERT INTO map_index.places (
              place_id,
              source,
              kind,
              name,
              short_name,
              display_name,
              municipality,
              district,
              latitude,
              longitude,
              importance,
              tags,
              search_text
            )
            VALUES (
              $1,
              'bootstrap',
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11::jsonb,
              $12
            )
            ON CONFLICT (place_id) DO UPDATE
            SET
              source = EXCLUDED.source,
              kind = EXCLUDED.kind,
              name = EXCLUDED.name,
              short_name = EXCLUDED.short_name,
              display_name = EXCLUDED.display_name,
              municipality = EXCLUDED.municipality,
              district = EXCLUDED.district,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              importance = EXCLUDED.importance,
              tags = EXCLUDED.tags,
              search_text = EXCLUDED.search_text
          `,
          [
            place.id,
            inferPlaceKind(place),
            place.name,
            place.shortName ?? place.name,
            place.label,
            inferMunicipality(place),
            inferDistrict(place),
            place.lat,
            place.lng,
            place.importance ?? 0.5,
            JSON.stringify({
              seed: "bootstrap",
              aliases: Array.isArray(place.aliases) ? place.aliases : [],
            }),
            buildPlaceSearchText(place),
          ],
        );

        await client.query("DELETE FROM map_index.place_aliases WHERE place_id = $1", [place.id]);
        for (const alias of Array.from(new Set(place.aliases ?? []))) {
          const value = String(alias ?? "").trim();
          if (!value) {
            continue;
          }

          await client.query(
            `
              INSERT INTO map_index.place_aliases (place_id, alias, normalized_alias)
              VALUES ($1, $2, $3)
            `,
            [place.id, value, normalizeSearchText(value)],
          );
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

try {
  await seedBootstrapPlaces();
  console.log(`Seeded ${BOOTSTRAP_PLACES.length} bootstrap places.`);
} finally {
  await closeMapDbPool();
}
