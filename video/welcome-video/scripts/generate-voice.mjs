import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const scenesPath = path.join(projectRoot, "src", "data", "scenes.json");
const timingsPath = path.join(projectRoot, "src", "data", "timings.generated.json");
const transcriptPath = path.join(projectRoot, "out", "transcript.txt");
const audioOutPath = path.join(projectRoot, "public", "audio", "narration.mp3");

const voiceId = process.env.ELEVENLABS_VOICE_ID || "Vbx8qgYYdsXg0blBt1S8";
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
  throw new Error("ELEVENLABS_API_KEY bulunamadi.");
}

const ensureDir = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const toWords = (chars, starts, ends) => {
  const words = [];
  let current = null;

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i] ?? "";
    const isWhitespace = /\s/.test(ch);
    const start = Number(starts[i] ?? 0);
    const end = Number(ends[i] ?? start);

    if (!isWhitespace) {
      if (!current) {
        current = {
          text: "",
          charStart: i,
          charEnd: i,
          start,
          end,
        };
      }
      current.text += ch;
      current.charEnd = i;
      current.end = end;
    } else if (current) {
      words.push(current);
      current = null;
    }
  }

  if (current) {
    words.push(current);
  }

  return words;
};

const scenes = JSON.parse(await fs.readFile(scenesPath, "utf8"));
const separator = " ";
let transcript = "";
const ranges = [];
let cursor = 0;

for (const scene of scenes) {
  const text = String(scene.voiceover ?? "").trim();
  const start = cursor;
  const end = start + text.length - 1;
  ranges.push({ id: scene.id, text, start, end });
  transcript += (transcript ? separator : "") + text;
  cursor = end + 2;
}

await ensureDir(transcriptPath);
await fs.writeFile(transcriptPath, transcript, "utf8");

const payload = {
  text: transcript,
  model_id: modelId,
  voice_settings: {
    stability: 0.42,
    similarity_boost: 0.72,
    style: 0.18,
    use_speaker_boost: true,
  },
};

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
  {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  },
);

if (!response.ok) {
  const body = await response.text();
  throw new Error(`ElevenLabs hatasi: ${response.status} ${body}`);
}

const json = await response.json();
if (!json.audio_base64) {
  throw new Error("ElevenLabs audio_base64 donmedi.");
}

await ensureDir(audioOutPath);
await fs.writeFile(audioOutPath, Buffer.from(json.audio_base64, "base64"));

const alignment = json.normalized_alignment || json.alignment;
if (!alignment?.characters || !alignment?.character_start_times_seconds || !alignment?.character_end_times_seconds) {
  throw new Error("Alignment verisi eksik.");
}

const chars = alignment.characters;
const starts = alignment.character_start_times_seconds;
const ends = alignment.character_end_times_seconds;
const words = toWords(chars, starts, ends);

const sceneTimings = [];
let prevEnd = 0;

for (const range of ranges) {
  const sceneWords = words.filter((word) => word.charEnd >= range.start && word.charStart <= range.end);
  const start = sceneWords.length > 0 ? sceneWords[0].start : prevEnd;
  const endCandidate = sceneWords.length > 0 ? sceneWords[sceneWords.length - 1].end + 0.32 : start + 1.2;

  const safeStart = Math.max(start, prevEnd - 0.04);
  const safeEnd = Math.max(endCandidate, safeStart + 1);
  prevEnd = safeEnd;

  sceneTimings.push({
    id: range.id,
    text: range.text,
    start: Number(safeStart.toFixed(3)),
    end: Number(safeEnd.toFixed(3)),
    words: sceneWords.map((w) => ({
      word: w.text,
      start: Number(w.start.toFixed(3)),
      end: Number(w.end.toFixed(3)),
    })),
  });
}

const totalDurationSeconds =
  sceneTimings.length > 0
    ? Number((sceneTimings[sceneTimings.length - 1].end + 0.8).toFixed(3))
    : 30;

const timingsOutput = {
  generatedAt: new Date().toISOString(),
  voice: { voiceId, modelId },
  totalDurationSeconds,
  sceneTimings,
};

await fs.writeFile(timingsPath, JSON.stringify(timingsOutput, null, 2), "utf8");

console.log("Voiceover ve zaman damgalari olusturuldu:");
console.log(`- Audio: ${audioOutPath}`);
console.log(`- Timings: ${timingsPath}`);
console.log(`- Toplam sure: ${totalDurationSeconds}s`);
