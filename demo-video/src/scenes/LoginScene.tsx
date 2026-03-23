import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Terminal } from "../components/Terminal";
import { fontFamily } from "../font";
import { colors } from "../colors";

export const LoginScene: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const spinnerChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const spinnerIndex = Math.floor(frame / 3) % spinnerChars.length;
  const isSending = frame >= 40 && frame < 65;
  const isVerifying = frame >= 95 && frame < 115;

  const lines = [
    {
      text: "upload-it login",
      color: colors.text,
      delay: 5,
      isCommand: true,
    },
    {
      text: "Enter your email: user@example.com",
      color: colors.text,
      delay: 25,
      isInstant: true,
    },
    ...(isSending
      ? [
          {
            text: `${spinnerChars[spinnerIndex]} Sending verification code...`,
            color: colors.cyan,
            delay: 0,
            isInstant: true,
          },
        ]
      : []),
    ...(frame >= 65
      ? [
          {
            text: "✓ Code sent!",
            color: colors.green,
            delay: 65,
            isInstant: true,
          },
          {
            text: "Enter the verification code: 847293",
            color: colors.text,
            delay: 75,
            isInstant: true,
          },
        ]
      : []),
    ...(isVerifying
      ? [
          {
            text: `${spinnerChars[spinnerIndex]} Verifying code...`,
            color: colors.cyan,
            delay: 0,
            isInstant: true,
          },
        ]
      : []),
    ...(frame >= 115
      ? [
          {
            text: "",
            color: colors.text,
            delay: 115,
            isInstant: true,
          },
          {
            text: "✓ Login successful!",
            color: colors.green,
            delay: 118,
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
        Authentication
      </div>
      <Terminal lines={lines} title="upload-it login" />
    </AbsoluteFill>
  );
};
