import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Terminal } from "../components/Terminal";
import { fontFamily } from "../font";
import { colors } from "../colors";

export const ListScene: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const spinnerChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const spinnerIndex = Math.floor(frame / 3) % spinnerChars.length;
  const isFetching = frame >= 25 && frame < 50;

  const lines = [
    {
      text: "upload-it list",
      color: colors.text,
      delay: 5,
      isCommand: true,
    },
    ...(isFetching
      ? [
          {
            text: `${spinnerChars[spinnerIndex]} Fetching file list...`,
            color: colors.cyan,
            delay: 0,
            isInstant: true,
          },
        ]
      : []),
    ...(frame >= 50
      ? [
          {
            text: "",
            color: colors.text,
            delay: 50,
            isInstant: true,
          },
          {
            text: "  demo.pdf          2.50 MB   https://upit.sargam.workers.dev/f/a3x9k2",
            color: colors.text,
            delay: 55,
            isInstant: true,
          },
          {
            text: "  screenshot.png    1.23 MB   https://upit.sargam.workers.dev/f/b7m4p1",
            color: colors.text,
            delay: 60,
            isInstant: true,
          },
          {
            text: "  report.csv        0.45 MB   https://upit.sargam.workers.dev/f/c2n8q5",
            color: colors.text,
            delay: 65,
            isInstant: true,
          },
          {
            text: "  video.mp4        48.70 MB   https://upit.sargam.workers.dev/f/d9w3r8",
            color: colors.text,
            delay: 70,
            isInstant: true,
          },
          {
            text: "",
            color: colors.text,
            delay: 78,
            isInstant: true,
          },
          {
            text: "  4 files  •  52.88 MB total",
            color: colors.textDim,
            delay: 80,
            isInstant: true,
          },
        ]
      : []),
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 60,
          fontFamily,
          fontSize: 20,
          fontWeight: 600,
          color: colors.accent,
          opacity: labelOpacity,
          textTransform: "uppercase",
          letterSpacing: 4,
        }}
      >
        File Management
      </div>
      <Terminal lines={lines} title="upload-it list" />
    </AbsoluteFill>
  );
};
