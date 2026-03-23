import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { IntroScene } from "./scenes/IntroScene";
import { UploadScene } from "./scenes/UploadScene";
import { LoginScene } from "./scenes/LoginScene";
import { ListScene } from "./scenes/ListScene";
import { OutroScene } from "./scenes/OutroScene";

export const Main: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Intro - 3.5s */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <IntroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      {/* Upload demo - 5s */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <UploadScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      {/* Login flow - 5s */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <LoginScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      {/* List files - 4s */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <ListScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      {/* Outro - 3.5s */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
