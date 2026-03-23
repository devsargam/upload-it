import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Terminal } from "../components/Terminal";
import { fontFamily } from "../font";
import { colors } from "../colors";

export const UploadScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Section label
  const labelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Spinner frames for "Uploading..." effect
  const spinnerChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const spinnerIndex = Math.floor(frame / 3) % spinnerChars.length;
  const isUploading = frame >= 55 && frame < 100;
  const uploadDone = frame >= 100;

  const lines = [
    {
      text: "upload-it demo.pdf",
      color: colors.text,
      delay: 5,
      isCommand: true,
    },
    {
      text: "⚠  Uploading anonymously — file expires in 24h.",
      color: colors.yellow,
      delay: 35,
      isInstant: true,
    },
    {
      text: "   Login for 7-day storage.",
      color: colors.textDim,
      delay: 38,
      isInstant: true,
    },
    {
      text: "",
      color: colors.text,
      delay: 42,
      isInstant: true,
    },
    ...(isUploading
      ? [
          {
            text: `${spinnerChars[spinnerIndex]} Uploading file...`,
            color: colors.cyan,
            delay: 0,
            isInstant: true,
          },
        ]
      : []),
    ...(uploadDone
      ? [
          {
            text: "✓ File uploaded successfully!",
            color: colors.green,
            delay: 100,
            isInstant: true,
          },
          {
            text: "",
            color: colors.text,
            delay: 102,
            isInstant: true,
          },
          {
            text: "File URL: https://upit.sargam.workers.dev/f/a3x9k2",
            color: colors.accentLight,
            delay: 108,
            isInstant: true,
          },
          {
            text: "✓ URL copied to clipboard",
            color: colors.textDim,
            delay: 115,
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
      {/* Section label */}
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
        Quick Upload
      </div>
      <Terminal lines={lines} title="upload-it" />
    </AbsoluteFill>
  );
};
