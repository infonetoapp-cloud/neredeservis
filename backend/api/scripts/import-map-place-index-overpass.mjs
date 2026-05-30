import { closeMapDbPool, withMapDbClient } from "../src/lib/map-db.js";

const REGIONS = [
  {
    key: "gebze",
    district: "Gebze",
    municipality: "Kocaeli",
    bbox: [40.758, 29.327, 40.861, 29.496],
  },
  {
    key: "darica",
    district: "Darica",
    municipality: "Kocaeli",
    bbox: [40.742, 29.349, 40.796, 29.429],
  },
  {
    key: "cayirova",
    district: "Cayirova",
    municipality: "Kocaeli",
    bbox: [40.797, 29.345, 40.857, 29.422],
  },
  {
    key: "dilovasi",
    district: "Dilovasi",
    municipality: "Kocaeli",
    bbox: [40.744, 29.457, 40.832, 29.593],
  },
  {
    key: "tuzla",
    district: "Tuzla",
    municipality: "Istanbul",
    bbox: [40.783, 29.219, 40.876, 29.366],
  },
];

const OVERPASS_ENDPOINTS = (
  process.env.MAP_PLACE_INDEX_OVERPASS_ENDPOINTS ??
  "https://lz4.overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass-api.de/api/interpreter"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const REQUEST_TIMEOUT_MS = Number(process.env.MAP_PLACE_INDEX_REQUEST_TIMEOUT_MS ?? 240000);
const REQUEST_RETRY_LIMIT = Math.max(1, Number(process.env.MAP_PLACE_INDEX_RETRY_LIMIT ?? 6));
const REQUEST_RETRY_DELAY_MS = Number(process.env.MAP_PLACE_INDEX_RETRY_DELAY_MS ?? 15000);
const REGION_PAUSE_MS = Number(process.env.MAP_PLACE_INDEX_REGION_PAUSE_MS ?? 10000);
const USER_AGENT = process.env.MAP_PLACE_INDEX_USER_AGENT ?? "neredeservis-map-import/1.0";

const QUERY_FILTERS = [
  { key: "place", objectTypes: ["node", "way", "relation"] },
  { key: "amenity", objectTypes: ["node", "way", "relation"] },
  { key: "shop", objectTypes: ["node", "way", "relation"] },
  { key: "tourism", objectTypes: ["node", "way", "relation"] },
  { key: "leisure", objectTypes: ["node", "way", "relation"] },
  { key: "railway", objectTypes: ["node", "way", "relation"] },
  { key: "public_transport", objectTypes: ["node", "way", "relation"] },
  { key: "aeroway", objectTypes: ["node", "way", "relation"] },
  { key: "office", objectTypes: ["node", "way", "relation"] },
  { key: "industrial", objectTypes: ["node", "way", "relation"] },
  { key: "highway", value: "bus_stop", objectTypes: ["node"] },
  { key: "landuse", value: "cemetery", objectTypes: ["node", "way", "relation"] },
];

function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr")
    .replaceAll("\u00e7", "c")
    .replaceAll("\u011f", "g")
    .replaceAll("\u0131", "i")
    .replaceAll("\u00f6", "o")
    .replaceAll("\u015f", "s")
    .replaceAll("\u00fc", "u")
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
      place.displayName,
      place.municipality,
      place.district,
      ...(place.aliases ?? []),
    ].join(" "),
  );
}

function splitTagList(value) {
  return String(value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readCoordinates(element) {
  if (typeof element?.lat === "number" && typeof element?.lon === "number") {
    return { lat: element.lat, lng: element.lon };
  }

  if (typeof element?.center?.lat === "number" && typeof element?.center?.lon === "number") {
    return { lat: element.center.lat, lng: element.center.lon };
  }

  return null;
}

function buildDisplayName(name, region) {
  const normalizedName = normalizeSearchText(name);
  const normalizedDistrict = normalizeSearchText(region.district);
  if (normalizedName.includes(normalizedDistrict)) {
    return `${name}, ${region.municipality}`;
  }
  return `${name}, ${region.district}`;
}

function deriveKind(tags) {
  if (tags.place) {
    return tags.place;
  }
  if (tags.shop === "mall") {
    return "mall";
  }
  if (tags.landuse === "cemetery") {
    return "cemetery";
  }
  if (tags.railway === "station" || tags.public_transport === "station") {
    return "station";
  }
  if (tags.highway === "bus_stop") {
    return "bus_stop";
  }
  if (tags.amenity) {
    return tags.amenity;
  }
  if (tags.shop) {
    return tags.shop;
  }
  if (tags.tourism) {
    return tags.tourism;
  }
  if (tags.leisure) {
    return tags.leisure;
  }
  if (tags.aeroway) {
    return tags.aeroway;
  }
  if (tags.office) {
    return tags.office;
  }
  if (tags.industrial) {
    return "industrial";
  }
  return "poi";
}

function deriveImportance(tags) {
  if (["city", "town", "borough", "suburb", "quarter", "neighbourhood"].includes(tags.place)) {
    return 0.97;
  }
  if (tags.shop === "mall") {
    return 0.97;
  }
  if (tags.landuse === "cemetery") {
    return 0.94;
  }
  if (tags.railway === "station" || tags.public_transport === "station") {
    return 0.94;
  }
  if (tags.amenity === "bus_station") {
    return 0.93;
  }
  if (["hospital", "university", "college"].includes(tags.amenity)) {
    return 0.92;
  }
  if (["school", "clinic", "marketplace", "pharmacy"].includes(tags.amenity)) {
    return 0.87;
  }
  if (tags.highway === "bus_stop") {
    return 0.8;
  }
  if (tags.shop || tags.tourism || tags.leisure) {
    return 0.84;
  }
  if (tags.industrial || tags.office) {
    return 0.79;
  }
  return 0.76;
}

function collectAliases(tags, name) {
  const aliasKeys = [
    "short_name",
    "alt_name",
    "official_name",
    "loc_name",
    "old_name",
    "name:tr",
    "name:en",
    "brand",
    "operator",
  ];
  const aliases = new Set();
  const normalizedName = normalizeSearchText(name);

  for (const key of aliasKeys) {
    for (const value of splitTagList(tags[key])) {
      const normalizedValue = normalizeSearchText(value);
      if (!normalizedValue || normalizedValue === normalizedName) {
        continue;
      }
      aliases.add(value);
    }
  }

  return Array.from(aliases);
}

function mapElementToPlace(element, region) {
  const tags = element?.tags && typeof element.tags === "object" ? element.tags : null;
  if (!tags) {
    return null;
  }

  const name = typeof tags.name === "string" ? tags.name.trim() : "";
  if (!name) {
    return null;
  }

  const coordinates = readCoordinates(element);
  if (!coordinates) {
    return null;
  }

  const kind = deriveKind(tags);
  const shortName = String(tags.short_name ?? tags.brand ?? name).trim() || name;
  const aliases = collectAliases(tags, name);

  return {
    placeId: `overpass:${region.key}:${element.type}:${element.id}`,
    source: "overpass",
    kind,
    name,
    shortName,
    displayName: buildDisplayName(name, region),
    municipality: region.municipality,
    district: region.district,
    latitude: coordinates.lat,
    longitude: coordinates.lng,
    importance: deriveImportance(tags),
    tags: {
      region: region.key,
      osmType: element.type,
      osmId: element.id,
      ...tags,
    },
    aliases,
  };
}

function buildOverpassQuery(region) {
  const [south, west, north, east] = region.bbox;
  const bbox = `(${south},${west},${north},${east})`;
  const lines = [];

  for (const filter of QUERY_FILTERS) {
    const keyPart = filter.value ? `["${filter.key}"="${filter.value}"]` : `["${filter.key}"]`;
    for (const objectType of filter.objectTypes) {
      lines.push(`  ${objectType}["name"]${keyPart}${bbox};`);
    }
  }

  return `
[out:json][timeout:180];
(
${lines.join("\n")}
);
out center tags qt;
`.trim();
}

function sleep(ms) {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(response) {
  const header = response.headers.get("retry-after");
  if (!header) {
    return null;
  }

  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const retryAt = Date.parse(header);
  if (Number.isNaN(retryAt)) {
    return null;
  }

  return Math.max(0, retryAt - Date.now());
}

function summarizeErrorBody(body) {
  return body.replace(/\s+/g, " ").trim().slice(0, 240);
}

async function fetchOverpassJson(query, regionKey) {
  const errors = [];

  for (let attempt = 0; attempt < REQUEST_RETRY_LIMIT; attempt += 1) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "text/plain; charset=UTF-8",
          "user-agent": USER_AGENT,
        },
        body: query,
        signal: controller.signal,
      });

      const text = await response.text();

      if (response.ok) {
        const json = JSON.parse(text);
        if (json && typeof json === "object" && Array.isArray(json.elements)) {
          return json;
        }

        errors.push(
          `${regionKey}:${endpoint}:invalid-json-shape:${summarizeErrorBody(text)}`,
        );
      } else {
        const bodySummary = summarizeErrorBody(text);
        errors.push(`${regionKey}:${endpoint}:http-${response.status}:${bodySummary}`);
      }

      const retryAfterMs = parseRetryAfterMs(response);
      const defaultDelay = REQUEST_RETRY_DELAY_MS * (attempt + 1);
      await sleep(Math.max(retryAfterMs ?? 0, defaultDelay));
    } catch (error) {
      errors.push(`${regionKey}:${endpoint}:${String(error)}`);
      await sleep(REQUEST_RETRY_DELAY_MS * (attempt + 1));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(`overpass-fetch-failed:${errors.join(" | ")}`);
}

async function fetchRegionPlaces(region) {
  const query = buildOverpassQuery(region);
  const payload = await fetchOverpassJson(query, region.key);
  const places = new Map();

  for (const element of payload.elements ?? []) {
    const place = mapElementToPlace(element, region);
    if (!place) {
      continue;
    }

    const dedupeKey = `${normalizeSearchText(place.name)}|${place.latitude.toFixed(5)}|${place.longitude.toFixed(5)}`;
    if (!places.has(dedupeKey)) {
      places.set(dedupeKey, place);
    }
  }

  return Array.from(places.values());
}

async function importPlaces(places) {
  if (places.length === 0) {
    throw new Error("no-overpass-places");
  }

  await withMapDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query("DELETE FROM map_index.places WHERE source = 'overpass'");

      for (const place of places) {
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
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13
            )
          `,
          [
            place.placeId,
            place.source,
            place.kind,
            place.name,
            place.shortName,
            place.displayName,
            place.municipality,
            place.district,
            place.latitude,
            place.longitude,
            place.importance,
            JSON.stringify(place.tags),
            buildPlaceSearchText(place),
          ],
        );

        for (const alias of place.aliases) {
          await client.query(
            `
              INSERT INTO map_index.place_aliases (place_id, alias, normalized_alias)
              VALUES ($1, $2, $3)
            `,
            [place.placeId, alias, normalizeSearchText(alias)],
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
  const allPlaces = [];
  const regionSummaries = [];

  for (const region of REGIONS) {
    const places = await fetchRegionPlaces(region);
    regionSummaries.push({ region: region.key, count: places.length });
    allPlaces.push(...places);
    await sleep(REGION_PAUSE_MS);
  }

  await importPlaces(allPlaces);
  console.log(
    JSON.stringify(
      {
        imported: allPlaces.length,
        regions: regionSummaries,
      },
      null,
      2,
    ),
  );
} finally {
  await closeMapDbPool();
}
