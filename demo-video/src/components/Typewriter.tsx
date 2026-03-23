import React from "react";
import { useCurrentFrame } from "remotion";
import { monoFontFamily } from "../font";
import { colors } from "../colors";

type TypewriterProps = {
  text: string;
  delay?: number;
  charsPerFrame?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  showCursor?: boolean;
};

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  delay = 0,
  charsPerFrame = 1.5,
  fontSize = 28,
  color = colors.text,
  fontFamily = monoFontFamily,
  showCursor = true,
}) => {
  const frame = useCurrentFrame();

  if (frame < delay) return null;

  const elapsed = frame - delay;
  const charsToShow = Math.min(Math.floor(elapsed * charsPerFrame), text.length);
  const displayText = text.slice(0, charsToShow);
  const isTyping = charsToShow < text.length;

  const cursorOpacity = Math.round(frame / 15) % 2 === 0 ? 1 : 0;

  return (
    <span
      style={{
        fontFamily,
        fontSize,
        color,
        whiteSpace: "pre",
      }}
    >
      {displayText}
      {showCursor && (isTyping || !isTyping) && (
        <span
          style={{
            opacity: isTyping ? 1 : cursorOpacity,
            backgroundColor: colors.accent,
            width: 3,
            height: fontSize * 1.2,
            display: "inline-block",
            marginLeft: 2,
            verticalAlign: "text-bottom",
          }}
        />
      )}
    </span>
  );
};
