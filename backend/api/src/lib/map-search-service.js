import { getMapReverseConfig, getMapSearchConfig } from "./map-config.js";
import { resolveBootstrapReverse, searchBootstrapPlaces } from "./map-bootstrap-places.js";
import { reversePlaceIndexPlace, searchPlaceIndexPlaces } from "./map-place-index-service.js";
import { HttpError } from "./http.js";

function sanitizeLimit(limit, maxLimit) {
  const parsed = Number.parseInt(String(limit ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return Math.min(6, maxLimit);
  }
  return Math.max(1, Math.min(parsed, maxLimit));
}

function dedupeSuggestions(items, limit) {
  const deduped = new Map();

  for (const item of items) {
    const key = `${String(item.label).toLocaleLowerCase("tr")}|${item.lat.toFixed(5)}|${item.lng.toFixed(5)}`;
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values()).slice(0, limit);
}

function logPlaceIndexFailure(stage, error) {
  console.error(
    JSON.stringify({
      level: "warn",
      event: "map_place_index_failed",
      stage,
      message: error instanceof Error ? error.message : "unknown_error",
    }),
  );
}

async function searchPlaceIndexPlacesSafe({ query, limit, proximity }) {
  try {
    return await searchPlaceIndexPlaces({ query, limit, proximity });
  } catch (error) {
    logPlaceIndexFailure("search", error);
    return [];
  }
}

async function reversePlaceIndexPlaceSafe({ lat, lng, maxDistanceMeters }) {
  try {
    return await reversePlaceIndexPlace({ lat, lng, maxDistanceMeters });
  } catch (error) {
    logPlaceIndexFailure("reverse", error);
    return null;
  }
}

export async function searchMapPlaces({ query, limit, proximity = null }) {
  const normalizedQuery = String(query ?? "").trim();
  if (normalizedQuery.length < 2) {
    throw new HttpError(400, "invalid-argument", "Arama icin en az 2 karakter gerekli.");
  }

  const config = getMapSearchConfig();
  const sanitizedLimit = sanitizeLimit(limit, config.limitMax);

  if (config.provider === "bootstrap") {
    return {
      provider: "bootstrap",
      items: searchBootstrapPlaces({
        query: normalizedQuery,
        limit: sanitizedLimit,
        proximity,
      }),
    };
  }

  if (config.provider === "place-index") {
    const placeIndexItems = await searchPlaceIndexPlacesSafe({
      query: normalizedQuery,
      limit: sanitizedLimit,
      proximity,
    });
    const bootstrapItems =
      placeIndexItems.length >= sanitizedLimit
        ? []
        : searchBootstrapPlaces({
            query: normalizedQuery,
            limit: sanitizedLimit,
            proximity,
          });

    return {
      provider: placeIndexItems.length > 0 ? "place-index" : "bootstrap",
      items: dedupeSuggestions([...placeIndexItems, ...bootstrapItems], sanitizedLimit),
    };
  }

  const bootstrapItems = searchBootstrapPlaces({
    query: normalizedQuery,
    limit: sanitizedLimit,
    proximity,
  });
  return {
    provider: "bootstrap",
    items: dedupeSuggestions(bootstrapItems, sanitizedLimit),
  };
}

export async function reverseMapPlace({ lat, lng }) {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir enlem degeri bekleniyor.");
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir boylam degeri bekleniyor.");
  }

  const config = getMapReverseConfig();
  const bootstrapResult = resolveBootstrapReverse({ lat, lng, maxDistanceMeters: config.bootstrapRadiusMeters });

  if (config.provider === "bootstrap") {
    return {
      provider: "bootstrap",
      item: bootstrapResult,
    };
  }

  if (config.provider === "place-index") {
    const placeIndexResult = await reversePlaceIndexPlaceSafe({
      lat,
      lng,
      maxDistanceMeters: config.bootstrapRadiusMeters,
    });
    return {
      provider: placeIndexResult ? "place-index" : bootstrapResult ? "bootstrap" : "place-index",
      item: placeIndexResult ?? bootstrapResult,
    };
  }

  return {
    provider: "bootstrap",
    item: bootstrapResult,
  };
}
