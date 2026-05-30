import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import diniScenes from "./data/dini-scenes.json";
import timingsData from "./data/dini-timings.generated.json";
import pexelsData from "./data/pexels-clips.generated.json";

type SceneMeta = {
  id: string;
  voiceover: string;
};

type WordTiming = {
  word: string;
  start: number;
  end: number;
};

type SceneTiming = {
  id: string;
  start: number;
  end: number;
  text: string;
  words?: WordTiming[];
};

type ClipMeta = {
  sceneId: string;
  localFile: string;
};

const typedScenes = diniScenes as SceneMeta[];
const safeTimings = ((timingsData as { sceneTimings?: SceneTiming[] }).sceneTimings ?? []) as SceneTiming[];
const clipEntries = ((pexelsData as { clips?: ClipMeta[] }).clips ?? []) as ClipMeta[];
const hasNarration = Boolean((timingsData as { generatedAt?: string | null }).generatedAt);
const fallbackTotalSeconds = 30;

const fallbackTimings = (): SceneTiming[] => {
  const perScene = fallbackTotalSeconds / Math.max(typedScenes.length, 1);
  return typedScenes.map((scene, index) => {
    const start = index * perScene;
    const end = start + perScene;
    return {
      id: scene.id,
      start,
      end,
      text: scene.voiceover,
      words: [],
    };
  });
};

const getActiveWordIndex = (words: WordTiming[], currentSecond: number): number => {
  if (!words.length) {
    return -1;
  }
  for (let i = words.length - 1; i >= 0; i -= 1) {
    if (currentSecond >= words[i].start) {
      return i;
    }
  }
  return -1;
};

export const DiniTikTokVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSecond = frame / fps;

  const sceneTimings = useMemo(() => {
    return safeTimings.length > 0 ? safeTimings : fallbackTimings();
  }, []);

  const clipByScene = useMemo(() => {
    return new Map(clipEntries.map((clip) => [clip.sceneId, clip]));
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: "#02050a" }}>
      {hasNarration ? <Audio src={staticFile("audio/dini-narration.mp3")} volume={1} /> : null}

      {sceneTimings.map((scene, index) => {
        const startFrame = Math.max(0, Math.floor(scene.start * fps));
        const nextStartSeconds = sceneTimings[index + 1]?.start;
        const safeSceneEnd = nextStartSeconds ? Math.min(scene.end, nextStartSeconds) : scene.end;
        const endFrame = Math.max(startFrame + 1, Math.ceil(Math.max(scene.start + 0.8, safeSceneEnd) * fps));
        const durationInFrames = Math.max(1, endFrame - startFrame);
        const localFrame = Math.max(0, frame - startFrame);

        const clipZoom = interpolate(localFrame, [0, durationInFrames], [1.04, 1.12], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const enterOpacity = interpolate(localFrame, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const exitOpacity = interpolate(localFrame, [Math.max(0, durationInFrames - 14), durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const subtitleOpacity = Math.min(enterOpacity, exitOpacity);
        const subtitleTranslateY = interpolate(localFrame, [0, 14], [36, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const clipInfo = clipByScene.get(scene.id);
        const subtitleWords = scene.words?.length
          ? scene.words
          : scene.text.split(/\s+/).map((word) => ({ word, start: scene.start, end: scene.end }));
        const activeWordIndex = getActiveWordIndex(subtitleWords, currentSecond);

        return (
          <Sequence key={scene.id} from={startFrame} durationInFrames={durationInFrames}>
            {clipInfo ? (
              <OffthreadVideo
                src={staticFile(clipInfo.localFile)}
                loop
                volume={0.08}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${clipZoom})`,
                }}
              />
            ) : (
              <AbsoluteFill style={{ backgroundColor: "#02050a" }} />
            )}

            <AbsoluteFill
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.24) 40%, rgba(0,0,0,0.4) 100%)",
              }}
            />

            <AbsoluteFill
              style={{
                justifyContent: "flex-end",
                padding: "0 52px 92px",
                opacity: subtitleOpacity,
                transform: `translateY(${subtitleTranslateY}px)`,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignSelf: "center",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "8px 10px",
                  borderRadius: 22,
                  backgroundColor: "rgba(0,0,0,0.52)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "18px 22px",
                  maxWidth: "92%",
                  textAlign: "center",
                  fontFamily: '"Montserrat", "Arial", sans-serif',
                  fontSize: 48,
                  lineHeight: 1.2,
                  letterSpacing: 0.2,
                }}
              >
                {subtitleWords.map((wordInfo, wordIndex) => {
                  const isSpoken = wordIndex <= activeWordIndex;
                  const isCurrent = wordIndex === activeWordIndex;
                  const pulse = isCurrent ? 1 + Math.sin(frame / 2.8) * 0.04 : 1;

                  return (
                    <span
                      key={`${scene.id}-${wordInfo.word}-${wordIndex}`}
                      style={{
                        color: isSpoken ? "#ffffff" : "rgba(255,255,255,0.62)",
                        fontWeight: isSpoken ? 760 : 600,
                        transform: `scale(${pulse})`,
                        textShadow: isSpoken ? "0 0 14px rgba(255,255,255,0.22)" : "none",
                      }}
                    >
                      {wordInfo.word}
                    </span>
                  );
                })}
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};