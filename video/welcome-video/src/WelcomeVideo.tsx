import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import scenes from "./data/scenes.json";
import timingsData from "./data/timings.generated.json";
import videoConfig from "./data/video-config.json";

type SceneMeta = {
  id: string;
  title: string;
  voiceover: string;
  points: string[];
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
  words: WordTiming[];
};

type WelcomeVideoProps = {
  fps: number;
};

const BRAND_THEMES = [
  { from: "#0A4FBF", to: "#0C2E78", accent: "#78D7FF" },
  { from: "#0D3A96", to: "#081C4A", accent: "#FFB26B" },
  { from: "#164CB5", to: "#0A2B72", accent: "#7AE6C7" },
  { from: "#1B5FD8", to: "#143D9C", accent: "#9DD6FF" },
  { from: "#0B3C94", to: "#061B49", accent: "#6CE5BD" },
  { from: "#2252B8", to: "#193D8A", accent: "#FFC27A" },
  { from: "#0E4DB3", to: "#072C74", accent: "#A9E2FF" },
];

const typedScenes = scenes as SceneMeta[];

const safeTimings = (timingsData.sceneTimings ?? []) as SceneTiming[];

const FALLBACK_TOTAL = 52;

const buildFallbackTimings = (): SceneTiming[] => {
  const durationPerScene = FALLBACK_TOTAL / typedScenes.length;
  return typedScenes.map((scene, index) => {
    const start = index * durationPerScene;
    const end = start + durationPerScene;
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

export const WelcomeVideo: React.FC<WelcomeVideoProps> = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentSecond = frame / fps;

  const sceneTimings = useMemo(() => {
    return safeTimings.length > 0 ? safeTimings : buildFallbackTimings();
  }, []);

  const activeSceneIndex = sceneTimings.findIndex(
    (scene, index) =>
      currentSecond >= scene.start &&
      (currentSecond < scene.end || index === sceneTimings.length - 1),
  );
  const safeIndex = activeSceneIndex >= 0 ? activeSceneIndex : 0;

  const sceneTiming = sceneTimings[safeIndex];
  const sceneMeta =
    typedScenes.find((item) => item.id === sceneTiming.id) ?? typedScenes[safeIndex] ?? typedScenes[0];
  const sceneTheme = BRAND_THEMES[safeIndex % BRAND_THEMES.length];

  const sceneStartFrame = Math.max(0, Math.floor(sceneTiming.start * fps));
  const enter = spring({
    frame: frame - sceneStartFrame,
    fps,
    config: {
      damping: 18,
      mass: 0.8,
      stiffness: 120,
    },
  });

  const cardOpacity = interpolate(enter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const cardTranslate = interpolate(enter, [0, 1], [56, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const glowPulse = 0.75 + Math.sin(frame / 22) * 0.08;

  const activeWordIndex = getActiveWordIndex(sceneTiming.words ?? [], currentSecond);

  const musicFadeInFrames = Math.floor((videoConfig.musicFadeInSeconds ?? 2) * fps);
  const musicFadeOutFrames = Math.floor((videoConfig.musicFadeOutSeconds ?? 2) * fps);

  return (
    <AbsoluteFill
      style={{
        fontFamily: "Plus Jakarta Sans, Inter, Arial, sans-serif",
        background: `linear-gradient(135deg, ${sceneTheme.from} 0%, ${sceneTheme.to} 100%)`,
        color: "white",
      }}
    >
      <Audio src={staticFile("audio/narration.mp3")} />
      {videoConfig.musicFile ? (
        <Audio
          src={staticFile(videoConfig.musicFile)}
          volume={(f) => {
            const fadeIn =
              musicFadeInFrames > 0
                ? interpolate(f, [0, musicFadeInFrames], [0, videoConfig.musicVolume], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
                : videoConfig.musicVolume;
            const fadeOut =
              musicFadeOutFrames > 0
                ? interpolate(
                    f,
                    [durationInFrames - musicFadeOutFrames, durationInFrames],
                    [videoConfig.musicVolume, 0],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  )
                : videoConfig.musicVolume;
            return Math.min(fadeIn, fadeOut);
          }}
        />
      ) : null}

      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            inset: -220,
            background:
              "radial-gradient(circle at 24% 24%, rgba(255,255,255,0.18), transparent 52%), radial-gradient(circle at 78% 74%, rgba(120,215,255,0.18), transparent 48%)",
            transform: `scale(${glowPulse})`,
            opacity: 0.9,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.35,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          padding: "76px 88px",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          columnGap: 48,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            opacity: cardOpacity,
            transform: `translateY(${cardTranslate}px)`,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.26)",
            background: "rgba(7, 21, 53, 0.52)",
            backdropFilter: "blur(10px)",
            padding: "42px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 30px 70px -35px rgba(5, 14, 35, 0.88)",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 22,
                letterSpacing: 0.8,
                fontWeight: 600,
                textTransform: "uppercase",
                background: "rgba(255,255,255,0.13)",
                color: "rgba(233,245,255,0.95)",
              }}
            >
              NeredeServis
            </div>

            <h1
              style={{
                marginTop: 28,
                marginBottom: 14,
                fontSize: 72,
                lineHeight: 1.04,
                letterSpacing: -1.4,
                fontWeight: 700,
              }}
            >
              {sceneMeta.title}
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 35,
                lineHeight: 1.38,
                color: "rgba(231,241,255,0.94)",
                minHeight: 140,
              }}
            >
              {sceneTiming.text}
            </p>
          </div>

          <div style={{ marginTop: 26, display: "grid", gap: 10 }}>
            {sceneMeta.points.map((point, index) => (
              <div
                key={point}
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.24)",
                  background: "rgba(255,255,255,0.11)",
                  padding: "12px 16px",
                  fontSize: 26,
                  color: "rgba(237,244,255,0.96)",
                  opacity: interpolate(enter, [0, 0.7 + index * 0.05, 1], [0, 0.55, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                {point}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            opacity: cardOpacity,
            transform: `translateY(${cardTranslate * 0.6}px)`,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(6px)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.24)",
              padding: "18px 22px",
              background: "rgba(6,18,48,0.45)",
            }}
          >
            <div
              style={{
                fontSize: 20,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: sceneTheme.accent,
                fontWeight: 700,
              }}
            >
              Sahne {safeIndex + 1} / {sceneTimings.length}
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 34,
                lineHeight: 1.2,
                fontWeight: 650,
              }}
            >
              {sceneMeta.title}
            </div>
          </div>

          <div
            style={{
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(4,14,38,0.42)",
              padding: "20px 22px",
            }}
          >
            <div
              style={{
                fontSize: 18,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "rgba(214,232,255,0.82)",
                marginBottom: 14,
              }}
            >
              Senkron anlatim
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px 6px",
                fontSize: 30,
                lineHeight: 1.4,
                color: "rgba(218,232,255,0.7)",
              }}
            >
              {(sceneTiming.words?.length ? sceneTiming.words : sceneTiming.text.split(" ").map((word) => ({ word })))
                .map((wordInfo, index) => {
                  const active = sceneTiming.words?.length ? index <= activeWordIndex : false;
                  return (
                    <span
                      key={`${wordInfo.word}-${index}`}
                      style={{
                        color: active ? "#ffffff" : "rgba(222,236,255,0.6)",
                        fontWeight: active ? 700 : 500,
                        transition: "color 120ms linear",
                      }}
                    >
                      {wordInfo.word}
                    </span>
                  );
                })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.11)",
              padding: "12px 16px",
              fontSize: 22,
            }}
          >
            <span>www.neredeservis.app</span>
            <span style={{ color: sceneTheme.accent, fontWeight: 700 }}>Welcome</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
