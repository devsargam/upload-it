import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { monoFontFamily } from "../font";
import { colors } from "../colors";

type TerminalLine = {
  text: string;
  color?: string;
  delay: number; // frame to start typing
  isCommand?: boolean;
  isInstant?: boolean;
  prefix?: string;
};

type TerminalProps = {
  lines: TerminalLine[];
  title?: string;
  showCursor?: boolean;
};

const CHARS_PER_FRAME = 1.5;

export const Terminal: React.FC<TerminalProps> = ({
  lines,
  title = "Terminal",
  showCursor = true,
}) => {
  const frame = useCurrentFrame();
  useVideoConfig();

  const windowEntrance = interpolate(frame, [0, 12], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const windowOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const renderedLines = useMemo(() => {
    return lines.map((line, i) => {
      if (frame < line.delay) return null;

      const elapsed = frame - line.delay;
      const fullText = line.text;

      let displayText: string;
      if (line.isInstant) {
        displayText = fullText;
      } else {
        const charsToShow = Math.floor(elapsed * CHARS_PER_FRAME);
        displayText = fullText.slice(0, charsToShow);
      }

      const isTyping = !line.isInstant && displayText.length < fullText.length;
      const lineColor = line.color || colors.text;
      const prefix = line.isCommand ? "$ " : line.prefix || "";

      return (
        <div
          key={i}
          style={{
            fontFamily: monoFontFamily,
            fontSize: 26,
            lineHeight: "42px",
            color: lineColor,
            whiteSpace: "pre",
          }}
        >
          {line.isCommand && (
            <span style={{ color: colors.green }}>{prefix}</span>
          )}
          {!line.isCommand && prefix && (
            <span style={{ color: colors.textDim }}>{prefix}</span>
          )}
          <span>{displayText}</span>
          {showCursor && isTyping && (
            <span
              style={{
                backgroundColor: colors.accent,
                color: colors.accent,
                width: 12,
                display: "inline-block",
              }}
            >
              |
            </span>
          )}
        </div>
      );
    });
  }, [frame, lines, showCursor]);

  return (
    <div
      style={{
        transform: `scale(${windowEntrance})`,
        opacity: windowOpacity,
        width: "85%",
        maxWidth: 1400,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${colors.terminalBorder}`,
        boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(108,99,255,0.1)`,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 20px",
          backgroundColor: "#1a1a2a",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: "#ff5f57",
          }}
        />
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: "#febc2e",
          }}
        />
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: "#28c840",
          }}
        />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: monoFontFamily,
            fontSize: 14,
            color: colors.textDim,
          }}
        >
          {title}
        </div>
      </div>
      {/* Content */}
      <div
        style={{
          backgroundColor: colors.terminalBg,
          padding: "30px 36px",
          minHeight: 300,
        }}
      >
        {renderedLines}
      </div>
    </div>
  );
};
