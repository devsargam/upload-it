import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "components/magicui/terminal";
import Lottie, { useLottie } from "lottie-react";
import animationData from "~/welcome/upload.json";

export function Welcome() {
  const options = {
    animationData: animationData,
    loop: true,
    autoplay: true,
  };

  const home = useLottie(options);

  return (
    <main className="flex items-center justify-center pt-16 pb-4 flex-col gap-y-5 bg-background">
      <Terminal className="h-96 w-2xl">
        <TypingAnimation>
          {/* <AnimatedSpan>Hello, world! </AnimatedSpan>
          <TypingAnimation>MagicUI is awesome!</TypingAnimation> */}
          npx upload-it file.pdf hello there
        </TypingAnimation>
      </Terminal>
      <div>{home.View}</div>
    </main>
  );
}
