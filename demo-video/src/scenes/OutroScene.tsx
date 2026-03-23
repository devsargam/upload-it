import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { fontFamily, monoFontFamily } from "../font";
import { colors } from "../colors";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 15 } });
  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const feature1 = spring({ frame, fps, delay: 10, config: { damping: 200 } });
  const feature2 = spring({ frame, fps, delay: 18, config: { damping: 200 } });
  const feature3 = spring({ frame, fps, delay: 26, config: { damping: 200 } });

  const installOpacity = interpolate(frame, [45, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const features = [
    { label: "Anonymous uploads", emoji: "🔓", progress: feature1 },
    { label: "Email authentication", emoji: "🔐", progress: feature2 },
    { label: "File management", emoji: "📂", progress: feature3 },
  ];

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
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent}25, transparent 70%)`,
          opacity: 0.3,
          filter: "blur(100px)",
        }}
      />

      <div
        style={{
          fontFamily,
          fontSize: 72,
          fontWeight: 800,
          color: colors.white,
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          letterSpacing: -2,
        }}
      >
        Get started today
      </div>

      <div
        style={{
          display: "flex",
          gap: 50,
          marginTop: 50,
        }}
      >
        {features.map((f, i) => (
          <div
            key={i}
            style={{
              opacity: f.progress,
              transform: `translateY(${interpolate(f.progress, [0, 1], [20, 0])}px)`,
              fontFamily,
              fontSize: 24,
              color: colors.textDim,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 30 }}>{f.emoji}</span>
            {f.label}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 70,
          opacity: installOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: monoFontFamily,
            fontSize: 28,
            color: colors.accent,
            padding: "16px 40px",
            borderRadius: 12,
            backgroundColor: `${colors.accent}12`,
            border: `1px solid ${colors.accent}35`,
          }}
        >
          npm i -g @devsargam/upload-it
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 18,
            color: colors.textMuted,
          }}
        >
          github.com/devsargam/upload-it
        </div>
      </div>
    </AbsoluteFill>
  );
};
