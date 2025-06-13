import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "components/magicui/terminal";
import Lottie, { useLottie } from "lottie-react";
import animationData from "~/welcome/upload.json";
import { useState, useEffect } from "react";
import { GenieEffect } from "components/genie-effect";

export function Welcome() {
  const options = {
    animationData: animationData,
    loop: true,
    autoplay: true,
  };

  const home = useLottie(options);

  // Toggle between maximised and minimised states
  const [isMaximized, setIsMaximized] = useState(false);

  // Automatically play maximise animation on mount
  useEffect(() => {
    const timeout = setTimeout(() => setIsMaximized(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <main className="flex items-center justify-center pt-16 pb-4 flex-col gap-y-5 bg-foreground h-screen">
      {/* Genie animation wrapper */}
      <GenieEffect
        expanded={isMaximized}
        duration={0.8}
        className="h-96 w-full max-w-4xl"
        onClick={() => setIsMaximized((v) => !v)}
      >
        <Terminal className="h-96 w-full max-w-4xl">
          <TypingAnimation>
            {/* <AnimatedSpan>Hello, world! </AnimatedSpan>
            <TypingAnimation>MagicUI is awesome!</TypingAnimation> */}
            npx upload-it file.pdf hello there npx upload-it file.pdf hello
            there npx upload-it file.pdf hello there npx upload-it file.pdf
            hello there npx upload-it file.pdf hello there npx upload-it
            file.pdf hello there npx upload-it file.pdf hello there npx
            upload-it file.pdf hello there npx upload-it file.pdf hello there
            npx upload-it file.pdf hello there npx upload-it file.pdf hello
            there npx upload-it file.pdf hello there npx upload-it file.pdf
            hello there npx upload-it file.pdf hello there npx upload-it
            file.pdf hello there npx upload-it file.pdf hello there
          </TypingAnimation>
        </Terminal>
      </GenieEffect>
      {/* <div>{home.View}</div> */}
    </main>
  );
}
