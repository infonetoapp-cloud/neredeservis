import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const scenesPath = path.join(projectRoot, "src", "data", "dini-scenes.json");
const manifestPath = path.join(projectRoot, "src", "data", "pexels-clips.generated.json");
const attributionPath = path.join(projectRoot, "out", "pexels-attribution.txt");
const mediaDir = path.join(projectRoot, "public", "media", "pexels");

const envCandidates = [
  path.join(projectRoot, ".env"),
  path.join(projectRoot, "..", ".env.video-keys"),
  path.join(projectRoot, "..", ".env"),
  path.join(projectRoot, "..", "..", ".env"),
];

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const parseEnvLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) {
    return null;
  }
  const key = trimmed.slice(0, eqIndex).trim();
  if (!key) {
    return null;
  }
  let value = trimmed.slice(eqIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
};

const loadEnvFromFile = async (envPath) => {
  try {
    const raw = await fs.readFile(envPath, "utf8");
    raw
      .split(/\r?\n/)
      .map(parseEnvLine)
      .filter(Boolean)
      .forEach((entry) => {
        if (!process.env[entry.key]) {
          process.env[entry.key] = entry.value;
        }
      });
  } catch {
    // Optional env files may not exist.
  }
};

const apiFetch = async (url, apiKey) => {
  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pexels API error ${response.status}: ${body}`);
  }
  return response.json();
};

const scoreFile = (file, duration) => {
  if (!file?.width || !file?.height) {
    return -Infinity;
  }
  if (file.height < file.width) {
    return -Infinity;
  }
  const targetWidth = 1080;
  const targetHeight = 1920;
  const widthPenalty = Math.abs(file.width - targetWidth) / 45;
  const heightPenalty = Math.abs(file.height - targetHeight) / 45;
  const durationBonus = duration >= 6 && duration <= 25 ? 10 : 0;
  const resolutionBonus = file.width >= 1080 && file.height >= 1920 ? 24 : 0;
  return 100 - widthPenalty - heightPenalty + durationBonus + resolutionBonus;
};

const pickBestVideo = (videos, usedIds) => {
  let best = null;
  let bestScore = -Infinity;

  for (const video of videos) {
    if (!video?.id || usedIds.has(String(video.id))) {
      continue;
    }
    const files = Array.isArray(video.video_files) ? video.video_files : [];
    for (const file of files) {
      if (file.file_type !== "video/mp4" || !file.link) {
        continue;
      }
      const score = scoreFile(file, Number(video.duration) || 0);
      if (score > bestScore) {
        bestScore = score;
        best = { video, file };
      }
    }
  }

  return best;
};

const searchCandidates = async (query, apiKey) => {
  const encoded = encodeURIComponent(query);
  const results = [];

  for (let page = 1; page <= 2; page += 1) {
    const url =
      `https://api.pexels.com/videos/search?query=${encoded}` +
      `&orientation=portrait&size=large&per_page=30&page=${page}`;
    const json = await apiFetch(url, apiKey);
    if (Array.isArray(json.videos)) {
      results.push(...json.videos);
    }
  }

  return results;
};

const downloadFile = async (url, outputPath) => {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Download failed ${response.status}: ${body}`);
  }
  const data = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(data));
};

for (const envPath of envCandidates) {
  await loadEnvFromFile(envPath);
}

const pexelsApiKey = process.env.PEXELS_API_KEY;
if (!pexelsApiKey) {
  throw new Error(
    "PEXELS_API_KEY bulunamadi. video/.env.video-keys dosyasina veya ortam degiskenine ekleyin.",
  );
}

const scenes = JSON.parse(await fs.readFile(scenesPath, "utf8"));
if (!Array.isArray(scenes) || scenes.length === 0) {
  throw new Error("dini-scenes.json bos veya gecersiz.");
}

await ensureDir(mediaDir);
await ensureDir(path.dirname(manifestPath));
await ensureDir(path.dirname(attributionPath));

const usedIds = new Set();
const clips = [];
const attributionLines = [];

for (const scene of scenes) {
  const sceneId = String(scene.id ?? "").trim();
  const query = String(scene.visualQuery ?? "").trim();
  if (!sceneId || !query) {
    throw new Error(`Sahne tanimi hatali: ${JSON.stringify(scene)}`);
  }

  const pool = await searchCandidates(query, pexelsApiKey);
  const pick = pickBestVideo(pool, usedIds);
  if (!pick) {
    throw new Error(`Pexels'te uygun dikey klip bulunamadi. query="${query}"`);
  }

  const videoId = String(pick.video.id);
  usedIds.add(videoId);
  const outputFileName = `${sceneId}-pexels-${videoId}.mp4`;
  const outputAbsolute = path.join(mediaDir, outputFileName);

  await downloadFile(pick.file.link, outputAbsolute);

  const clip = {
    sceneId,
    query,
    provider: "Pexels",
    videoId,
    durationSeconds: Number(pick.video.duration ?? 0),
    width: Number(pick.file.width ?? 0),
    height: Number(pick.file.height ?? 0),
    localFile: `media/pexels/${outputFileName}`,
    pexelsVideoUrl: pick.video.url ?? null,
    photographer: pick.video.user?.name ?? null,
    photographerUrl: pick.video.user?.url ?? null,
  };

  clips.push(clip);
  attributionLines.push(
    `${sceneId}: Pexels Video #${clip.videoId} | ${clip.photographer ?? "Unknown"} | ${clip.pexelsVideoUrl ?? "-"}`,
  );
  console.log(
    `[ok] ${sceneId} <= video ${clip.videoId} (${clip.width}x${clip.height}, ${clip.durationSeconds}s)`,
  );
}

const manifest = {
  generatedAt: new Date().toISOString(),
  provider: "Pexels",
  clips,
};

await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
await fs.writeFile(attributionPath, attributionLines.join("\n"), "utf8");

console.log("Pexels klipleri indirildi.");
console.log(`- Manifest: ${manifestPath}`);
console.log(`- Attribution: ${attributionPath}`);
