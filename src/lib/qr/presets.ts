import type { QrDesign } from "./types";

export type DesignPreset = Omit<QrDesign, "content" | "logo" | "frame"> & {
  frame?: Partial<QrDesign["frame"]>;
};

export interface Preset {
  id: string;
  name: string;
  design: DesignPreset;
}

const base = {
  eyeColor: null,
  bg: "#ffffff",
  transparentBg: false,
  margin: 4,
} as const;

export const PRESETS: Preset[] = [
  {
    id: "classic",
    name: "Classic",
    design: {
      ...base,
      ecLevel: "M",
      fg: { type: "solid", color: "#111111" },
      dotStyle: "square",
      eyeFrameStyle: "square",
      eyeBallStyle: "square",
    },
  },
  {
    id: "soft",
    name: "Soft ink",
    design: {
      ...base,
      ecLevel: "Q",
      fg: { type: "solid", color: "#1f2937" },
      dotStyle: "rounded",
      eyeFrameStyle: "rounded",
      eyeBallStyle: "rounded",
    },
  },
  {
    id: "dots",
    name: "Dotted",
    design: {
      ...base,
      ecLevel: "Q",
      fg: { type: "solid", color: "#1e1b4b" },
      eyeColor: "#4f46e5",
      dotStyle: "dots",
      eyeFrameStyle: "circle",
      eyeBallStyle: "circle",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    design: {
      ...base,
      ecLevel: "Q",
      fg: { type: "linear", from: "#0c4a6e", to: "#0e7490", angle: 45 },
      dotStyle: "rounded",
      eyeFrameStyle: "rounded",
      eyeBallStyle: "circle",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    design: {
      ...base,
      ecLevel: "Q",
      fg: { type: "linear", from: "#9f1239", to: "#c2410c", angle: 135 },
      dotStyle: "classy",
      eyeFrameStyle: "rounded",
      eyeBallStyle: "rounded",
    },
  },
  {
    id: "forest",
    name: "Forest",
    design: {
      ...base,
      ecLevel: "Q",
      bg: "#f0fdf4",
      fg: { type: "radial", from: "#14532d", to: "#166534" },
      dotStyle: "diamond",
      eyeFrameStyle: "square",
      eyeBallStyle: "diamond",
    },
  },
  {
    id: "print",
    name: "Print pro",
    design: {
      ...base,
      ecLevel: "H",
      fg: { type: "solid", color: "#000000" },
      dotStyle: "square",
      eyeFrameStyle: "square",
      eyeBallStyle: "square",
    },
  },
];
