import type { Payload } from "./payload";

export type EcLevel = "L" | "M" | "Q" | "H";

export type DotStyle = "square" | "rounded" | "dots" | "classy" | "diamond";
export type EyeFrameStyle = "square" | "rounded" | "circle";
export type EyeBallStyle = "square" | "rounded" | "circle" | "diamond";

export type Fill =
  | { type: "solid"; color: string }
  | { type: "linear"; from: string; to: string; angle: number }
  | { type: "radial"; from: string; to: string };

export type FrameStyle = "none" | "label-bottom" | "label-top" | "card";

export interface FrameOptions {
  style: FrameStyle;
  /** Label text for label frames, CTA text for cards. */
  text: string;
  /** Card title (card style only). */
  title: string;
  color: string;
  textColor: string;
}

export interface LogoOptions {
  /** Data URL of the uploaded image. Never leaves the browser. */
  dataUrl: string | null;
  /** Logo width as a fraction of the QR symbol width (0.1–0.3). */
  size: number;
  /** Remove modules behind the logo so it sits on a clean background. */
  excavate: boolean;
}

export interface QrDesign {
  /** The exact text encoded in the code. */
  content: string;
  /** The form the content was made from (absent on older saved codes = URL). */
  payload?: Payload;
  ecLevel: EcLevel;
  fg: Fill;
  /** Optional separate colour for the three corner eyes; null = use fg. */
  eyeColor: string | null;
  bg: string;
  transparentBg: boolean;
  dotStyle: DotStyle;
  eyeFrameStyle: EyeFrameStyle;
  eyeBallStyle: EyeBallStyle;
  /** Quiet zone in modules. The spec minimum is 4. */
  margin: number;
  logo: LogoOptions;
  frame: FrameOptions;
}

export const DEFAULT_DESIGN: QrDesign = {
  content: "",
  ecLevel: "M",
  fg: { type: "solid", color: "#111111" },
  eyeColor: null,
  bg: "#ffffff",
  transparentBg: false,
  dotStyle: "square",
  eyeFrameStyle: "square",
  eyeBallStyle: "square",
  margin: 4,
  logo: { dataUrl: null, size: 0.22, excavate: true },
  frame: {
    style: "none",
    text: "SCAN ME",
    title: "Your title",
    color: "#111111",
    textColor: "#ffffff",
  },
};

/** Largest safe logo width (fraction of symbol) per error-correction level. */
export const MAX_LOGO_SIZE: Record<EcLevel, number> = {
  L: 0.14,
  M: 0.18,
  Q: 0.24,
  H: 0.3,
};
