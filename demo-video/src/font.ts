import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: interFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

export const fontFamily = interFamily;
export const monoFontFamily = monoFamily;
