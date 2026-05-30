import React from "react";
import { Composition } from "remotion";
import timingsData from "./data/timings.generated.json";
import diniTimingsData from "./data/dini-timings.generated.json";
import { DiniTikTokVideo } from "./DiniTikTokVideo";
import { WelcomeVideo } from "./WelcomeVideo";

const FPS = 30;
const FALLBACK_DURATION_SECONDS = 52;
const durationSeconds = Math.max(
  Number(timingsData.totalDurationSeconds) || FALLBACK_DURATION_SECONDS,
  20,
);
const diniDurationSeconds = Math.max(Number(diniTimingsData.totalDurationSeconds) || 30, 18);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NeredeServisWelcome"
        component={WelcomeVideo}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={Math.ceil((durationSeconds + 1.5) * FPS)}
        defaultProps={{
          fps: FPS,
        }}
      />
      <Composition
        id="DiniTikTok1080"
        component={DiniTikTokVideo}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.ceil((diniDurationSeconds + 0.8) * FPS)}
        defaultProps={{
          fps: FPS,
        }}
      />
    </>
  );
};
