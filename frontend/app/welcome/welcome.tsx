import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "components/magicui/terminal";
import Lottie, { useLottie } from "lottie-react";
import animationData from "~/welcome/upload.json";
import { motion } from "motion/react";

export function Welcome() {
  const options = {
    animationData: animationData,
    loop: true,
    autoplay: true,
  };

  const home = useLottie(options);

  return (
    <main className="flex items-center justify-center pt-16 pb-4 flex-col gap-y-5 bg-background">
      {/* Genie animation wrapper */}
      <motion.div
        variants={{
          minimized: {
            scaleX: 0.4,
            scaleY: 0.1,
            y: 300,
            opacity: 0,
          },
          maximized: {
            scaleX: 1,
            scaleY: 1,
            y: 0,
            opacity: 1,
          },
        }}
        initial="minimized"
        animate="maximized"
        transition={{
          type: "tween",
          duration: 1,
          ease: "anticipate",
        }}
        className="h-96 w-full max-w-4xl"
        style={{ originX: 0.5, originY: 1 }}
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
      </motion.div>
      {/* <div>{home.View}</div> */}
    </main>
  );
}
