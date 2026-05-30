import { closeMapDbPool } from "../src/lib/map-db.js";
import { reverseMapPlace, searchMapPlaces } from "../src/lib/map-search-service.js";

const searchQueries = [
  "Gebze Center",
  "Darica Mezarligi",
  "Cevahir AVM",
  "Bilisim Vadisi",
  "Tuzla Marina",
];

try {
  for (const query of searchQueries) {
    const result = await searchMapPlaces({ query, limit: 3 });
    console.log(
      JSON.stringify(
        {
          kind: "search",
          query,
          provider: result.provider,
          items: result.items,
        },
        null,
        2,
      ),
    );
  }

  const reverse = await reverseMapPlace({
    lat: 40.820643,
    lng: 29.430399,
  });

  console.log(
    JSON.stringify(
      {
        kind: "reverse",
        lat: 40.820643,
        lng: 29.430399,
        provider: reverse.provider,
        item: reverse.item,
      },
      null,
      2,
    ),
  );
} finally {
  await closeMapDbPool();
}
