import https from "https";

const endpoints = [
  "https://router.project-osrm.org/route/v1/driving/29.43,40.805;29.46,40.812?geometries=geojson&overview=full",
  "https://router.project-osrm.org/route/v1/driving/29.42,40.795;29.44,40.808?geometries=geojson&overview=full",
  "https://router.project-osrm.org/route/v1/driving/29.445,40.802;29.415,40.808?geometries=geojson&overview=full",
];

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
      res.on("error", reject);
    });
  });
}

for (let i = 0; i < endpoints.length; i++) {
  const json = await fetchJSON(endpoints[i]);
  const coords = json.routes[0].geometry.coordinates;
  // Convert from [lng, lat] to [lat, lng] for Leaflet
  const leafletCoords = coords.map(([lng, lat]) => `[${lat},${lng}]`);
  console.log(`--- ROUTE ${i + 2} (${coords.length} points) ---`);
  console.log(`[${leafletCoords.join(",")}]`);
}
