import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { fontFamily, monoFontFamily } from "../font";
import { colors } from "../colors";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Arrow icon entrance
  const arrowScale = spring({ frame, fps, config: { damping: 12 } });
  const arrowRotation = interpolate(arrowScale, [0, 1], [-90, 0]);

  // Title entrance
  const titleProgress = spring({
    frame,
    fps,
    delay: 8,
    config: { damping: 15 },
  });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  // Tagline entrance
  const taglineOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [20, 35], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Install hint
  const hintOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle gradient pulse
  const glowOpacity = interpolate(
    frame,
    [0, 30, 60, 90],
    [0, 0.15, 0.08, 0.15],
    {
      extrapolateRight: "extend",
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent}40, transparent 70%)`,
          opacity: glowOpacity,
          filter: "blur(80px)",
        }}
      />

      {/* Upload arrow icon */}
      <div
        style={{
          transform: `scale(${arrowScale}) rotate(${arrowRotation}deg)`,
          marginBottom: 30,
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily,
          fontSize: 96,
          fontWeight: 800,
          color: colors.white,
          transform: `translateY(${titleY}px)`,
          opacity: titleProgress,
          letterSpacing: -3,
        }}
      >
        upload-it
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily,
          fontSize: 32,
          fontWeight: 400,
          color: colors.textDim,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          marginTop: 12,
        }}
      >
        Share files from your terminal in seconds
      </div>

      {/* Install command hint */}
      <div
        style={{
          fontFamily: monoFontFamily,
          fontSize: 22,
          color: colors.accent,
          opacity: hintOpacity,
          marginTop: 50,
          padding: "12px 28px",
          borderRadius: 10,
          backgroundColor: `${colors.accent}10`,
          border: `1px solid ${colors.accent}30`,
        }}
      >
        npm i -g @devsargam/upload-it
      </div>
    </AbsoluteFill>
  );
};
