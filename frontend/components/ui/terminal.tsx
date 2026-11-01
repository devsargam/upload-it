import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "~/lib/utils";

function useInView(ref: React.RefObject<HTMLElement | null>, once = true) {
  const [inView, setInView] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || (once && triggered.current)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          setInView(true);
          if (once) {
            triggered.current = true;
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, once]);

  return inView;
}

type TokenType =
  | "command"
  | "flag"
  | "string"
  | "number"
  | "operator"
  | "path"
  | "variable"
  | "comment"
  | "default";

interface Token {
  type: TokenType;
  value: string;
}

function tokenizeBash(text: string): Token[] {
  const tokens: Token[] = [];
  const words = text.split(/(\s+)/);

  let isFirstWord = true;

  for (const word of words) {
    if (/^\s+$/.test(word)) {
      tokens.push({ type: "default", value: word });
      continue;
    }

    if (word.startsWith("#")) {
      tokens.push({ type: "comment", value: word });
      continue;
    }

    if (word.startsWith("$")) {
      tokens.push({ type: "variable", value: word });
      isFirstWord = false;
      continue;
    }

    if (word.startsWith("--") || word.startsWith("-")) {
      tokens.push({ type: "flag", value: word });
      isFirstWord = false;
      continue;
    }

    if (/^["'].*["']$/.test(word)) {
      tokens.push({ type: "string", value: word });
      isFirstWord = false;
      continue;
    }

    if (/^\d+$/.test(word)) {
      tokens.push({ type: "number", value: word });
      isFirstWord = false;
      continue;
    }

    if (/^[|>&<]+$/.test(word)) {
      tokens.push({ type: "operator", value: word });
      isFirstWord = true;
      continue;
    }

    if (word.includes("/") || word.startsWith(".") || word.startsWith("~")) {
      tokens.push({ type: "path", value: word });
      isFirstWord = false;
      continue;
    }

    if (isFirstWord) {
      tokens.push({ type: "command", value: word });
      isFirstWord = false;
      continue;
    }

    tokens.push({ type: "default", value: word });
  }

  return tokens;
}

const tokenColors: Record<TokenType, string> = {
  command: "text-emerald-400",
  flag: "text-sky-400",
  string: "text-amber-300",
  number: "text-purple-400",
  operator: "text-red-400",
  path: "text-zinc-200",
  variable: "text-pink-400",
  comment: "text-zinc-500",
  default: "text-zinc-200",
};

function SyntaxHighlightedText({ text }: { text: string }) {
  const tokens = tokenizeBash(text);

  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} className={tokenColors[token.type]}>
          {token.value}
        </span>
      ))}
    </>
  );
}

interface TerminalLine {
  type: "command" | "output";
  content: string;
}

const URL_PATTERN = /(https?:\/\/\S+)/;

/** Success lines go green and links stand out, like a real CLI's colours. */
function OutputLine({ text }: { text: string }) {
  if (text.startsWith("✓") || text.startsWith("✔")) {
    return <span className="text-[#5af78e]">{text}</span>;
  }
  return (
    <span className="text-zinc-300">
      {text.split(URL_PATTERN).map((part, i) =>
        URL_PATTERN.test(part) ? (
          <span key={i} className="text-[#57c7ff]">{part}</span>
        ) : (
          part
        ),
      )}
    </span>
  );
}

export interface TerminalProps {
  commands: string[];
  outputs?: Record<number, string[]>;
  /** The zsh prompt, macOS style: user@host dir % */
  prompt?: string;
  className?: string;
  typingSpeed?: number;
  delayBetweenCommands?: number;
  initialDelay?: number;
  /** Typing waits until this is true (e.g. until the window finishes opening) */
  autoStart?: boolean;
}

/**
 * The inside of a terminal window: types out commands and prints their output.
 */
export function Terminal({
  commands,
  outputs = {},
  prompt = "you@macbook ~ %",
  className,
  typingSpeed = 50,
  delayBetweenCommands = 800,
  initialDelay = 500,
  autoStart = true,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);

  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [commandIdx, setCommandIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [outputIdx, setOutputIdx] = useState(-1);
  const [phase, setPhase] = useState<
    "idle" | "typing" | "executing" | "outputting" | "pausing" | "done"
  >("idle");

  const currentCommand = commands[commandIdx] || "";
  const currentOutputs = useMemo(
    () => outputs[commandIdx] || [],
    [outputs, commandIdx],
  );
  const isLastCommand = commandIdx === commands.length - 1;

  useEffect(() => {
    if (!inView || !autoStart || phase !== "idle") return;
    const t = setTimeout(() => setPhase("typing"), initialDelay);
    return () => clearTimeout(t);
  }, [inView, autoStart, phase, initialDelay]);

  useEffect(() => {
    if (phase !== "typing") return;

    if (charIdx < currentCommand.length) {
      const t = setTimeout(
        () => {
          setCurrentText(currentCommand.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        },
        typingSpeed + Math.random() * 30,
      );
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase("executing"), 80);
      return () => clearTimeout(t);
    }
  }, [phase, charIdx, currentCommand, typingSpeed]);

  useEffect(() => {
    if (phase !== "executing") return;

    setLines((prev) => [...prev, { type: "command", content: currentCommand }]);
    setCurrentText("");

    if (currentOutputs.length > 0) {
      setOutputIdx(0);
      setPhase("outputting");
    } else if (isLastCommand) {
      setPhase("done");
    } else {
      setPhase("pausing");
    }
  }, [phase, currentCommand, currentOutputs.length, isLastCommand]);

  useEffect(() => {
    if (phase !== "outputting") return;

    if (outputIdx >= 0 && outputIdx < currentOutputs.length) {
      const t = setTimeout(() => {
        setLines((prev) => [
          ...prev,
          { type: "output", content: currentOutputs[outputIdx] },
        ]);
        setOutputIdx((i) => i + 1);
      }, 150);
      return () => clearTimeout(t);
    } else if (outputIdx >= currentOutputs.length) {
      const t = setTimeout(() => {
        if (isLastCommand) {
          setPhase("done");
        } else {
          setPhase("pausing");
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [phase, outputIdx, currentOutputs, isLastCommand]);

  useEffect(() => {
    if (phase !== "pausing") return;
    const t = setTimeout(() => {
      setCharIdx(0);
      setOutputIdx(-1);
      setCommandIdx((c) => c + 1);
      setPhase("typing");
    }, delayBetweenCommands);
    return () => clearTimeout(t);
  }, [phase, delayBetweenCommands]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, phase]);

  const promptText = <span className="text-zinc-200">{prompt} </span>;
  // macOS Terminal's block cursor: solid while typing, blinking at rest
  const cursor = (blinking: boolean) => (
    <span
      className={cn(
        "inline-block h-[1.1em] w-[0.6em] translate-y-[0.15em] bg-zinc-300",
        blinking && "cursor-blink",
      )}
    />
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full cursor-text overflow-y-auto px-2 py-1.5 font-mono select-text text-xs leading-[1.45] sm:text-[13px]",
        className,
      )}
    >
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
          {line.type === "command" ? (
            <>
              {promptText}
              <SyntaxHighlightedText text={line.content} />
            </>
          ) : (
            <OutputLine text={line.content} />
          )}
        </div>
      ))}

      {phase === "typing" ? (
        <div className="whitespace-pre-wrap [overflow-wrap:anywhere]">
          {promptText}
          <SyntaxHighlightedText text={currentText} />
          {cursor(false)}
        </div>
      ) : (
        // Like a real shell, the next prompt only appears once output is done
        (phase === "idle" || phase === "pausing" || phase === "done") && (
          <div className="whitespace-pre-wrap">
            {promptText}
            {cursor(true)}
          </div>
        )
      )}
    </div>
  );
}
