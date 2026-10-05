import type { QrDesign } from "./types";

function luminance(hex: string) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const v = parseInt(h.slice(0, 6), 16);
  const ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export interface Warning {
  level: "warn" | "error";
  message: string;
}

/** Design checks that don't need rendering. */
export function designWarnings(design: QrDesign): Warning[] {
  const out: Warning[] = [];
  // Transparent codes are usually placed on light backgrounds; assume white.
  const bg = design.transparentBg ? "#ffffff" : design.bg;
  const fgColors = design.fg.type === "solid" ? [design.fg.color] : [design.fg.from, design.fg.to];
  if (design.eyeColor) fgColors.push(design.eyeColor);

  const worst = Math.min(...fgColors.map((c) => contrastRatio(c, bg)));
  if (worst < 3) {
    out.push({ level: "error", message: `Contrast is too low (${worst.toFixed(1)}:1). Aim for at least 4:1.` });
  } else if (worst < 4) {
    out.push({ level: "warn", message: `Contrast is borderline (${worst.toFixed(1)}:1).` });
  }

  if (fgColors.some((c) => luminance(c) > luminance(bg))) {
    out.push({
      level: "warn",
      message: "Light code on a dark background (inverted). Many scanner apps can't read it.",
    });
  }
  if (design.transparentBg) {
    out.push({ level: "warn", message: "Transparent background: place the code on a light, plain surface." });
  }
  if (design.margin < 4) {
    out.push({ level: "warn", message: "Quiet zone is under 4 modules. Leave space around the code when printing." });
  }
  if (design.logo.dataUrl && design.ecLevel !== "H") {
    out.push({ level: "warn", message: "With a logo, use error correction H." });
  }
  return out;
}
