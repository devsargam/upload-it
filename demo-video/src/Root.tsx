import { Composition } from "remotion";
import { Main } from "./Main";

// Total: 105 + 150 + 150 + 120 + 105 = 630
// Minus transitions: 15 * 4 = 60
// Total: 570 frames = 19 seconds at 30fps

export const RemotionRoot = () => {
  return (
    <Composition
      id="UploadItDemo"
      component={Main}
      durationInFrames={570}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
