import { create } from "qrcode";
import { Path, type Layer, type Scene } from "./scene";
import type { EcLevel, Fill, QrDesign } from "./types";

export interface QrMatrix {
  size: number;
  version: number;
  isDark: (row: number, col: number) => boolean;
}

/** Encodes `text` exactly as given. No redirect, no short link. */
export function buildMatrix(text: string, ecLevel: EcLevel): QrMatrix {
  const qr = create(text, { errorCorrectionLevel: ecLevel });
  const { size } = qr.modules;
  return {
    size,
    version: qr.version,
    isDark: (r, c) => r >= 0 && c >= 0 && r < size && c < size && !!qr.modules.get(r, c),
  };
}

const isFinder = (r: number, c: number, size: number) =>
  (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

/** Builds the full drawing (QR, eyes, logo, frame) for a design. */
export function renderDesign(design: QrDesign, matrix: QrMatrix): Scene {
  const size = matrix.size;
  const m = design.margin;
  const q = size + m * 2; // QR box including quiet zone

  // --- Frame layout --------------------------------------------------------
  const { frame } = design;
  let W = q;
  let H = q;
  let qx = 0;
  let qy = 0;
  const frameLayers: Layer[] = [];

  const fitText = (text: string, band: number, maxW: number, ratio: number) =>
    Math.min(band * ratio, maxW / Math.max(1, text.length * 0.6));

  if (frame.style === "label-bottom" || frame.style === "label-top") {
    const pad = Math.max(1, q * 0.04);
    const band = q * 0.2;
    W = q + pad * 2;
    H = q + pad * 2 + band;
    qx = pad;
    qy = frame.style === "label-top" ? pad + band : pad;
    const r = q * 0.05;
    // Ring around the QR plus the label band; the QR area is cut out so a
    // transparent background stays transparent.
    const p = new Path().roundedRect(0, 0, W, H, [r, r, r, r]).rect(qx, qy, q, q);
    frameLayers.push({ kind: "path", path: p, fill: { type: "solid", color: frame.color }, evenOdd: true });
    const textSize = fitText(frame.text, band, W * 0.88, 0.5);
    const bandTop = frame.style === "label-top" ? pad : pad + q;
    frameLayers.push({
      kind: "text",
      x: W / 2,
      y: bandTop + band / 2 + textSize * 0.36,
      size: textSize,
      text: frame.text,
      color: frame.textColor,
      bold: true,
    });
  } else if (frame.style === "card") {
    const pad = q * 0.1;
    const titleBand = q * 0.24;
    const ctaBand = q * 0.2;
    W = q + pad * 2;
    H = q + pad * 2 + titleBand + ctaBand;
    qx = pad;
    qy = pad + titleBand;
    const r = q * 0.06;
    const p = new Path().roundedRect(0, 0, W, H, [r, r, r, r]).rect(qx, qy, q, q);
    frameLayers.push({ kind: "path", path: p, fill: { type: "solid", color: frame.color }, evenOdd: true });
    const titleSize = fitText(frame.title, titleBand, W * 0.88, 0.48);
    frameLayers.push({
      kind: "text",
      x: W / 2,
      y: pad + titleBand / 2 + titleSize * 0.36,
      size: titleSize,
      text: frame.title,
      color: frame.textColor,
      bold: true,
    });
    const ctaSize = fitText(frame.text, ctaBand, W * 0.88, 0.36);
    frameLayers.push({
      kind: "text",
      x: W / 2,
      y: qy + q + ctaBand / 2 + ctaSize * 0.36,
      size: ctaSize,
      text: frame.text,
      color: frame.textColor,
      bold: false,
    });
  }

  // Symbol origin (top-left module) in scene coordinates.
  const ox = qx + m;
  const oy = qy + m;
  const layers: Layer[] = [];

  if (!design.transparentBg) {
    layers.push({ kind: "path", path: new Path().rect(qx, qy, q, q), fill: { type: "solid", color: design.bg } });
  }

  // --- Logo area -----------------------------------------------------------
  const logo = design.logo;
  const logoW = logo.dataUrl ? size * logo.size : 0;
  const lx = ox + (size - logoW) / 2;
  const ly = oy + (size - logoW) / 2;
  const inLogo = (r: number, c: number) => {
    if (!logoW || !logo.excavate) return false;
    const pad = 0.5;
    const x = ox + c + 0.5;
    const y = oy + r + 0.5;
    return x > lx - pad && x < lx + logoW + pad && y > ly - pad && y < ly + logoW + pad;
  };

  // --- Data modules --------------------------------------------------------
  const dark = (r: number, c: number) => matrix.isDark(r, c) && !isFinder(r, c, size) && !inLogo(r, c);
  const dots = new Path();

  for (let r = 0; r < size; r++) {
    if (design.dotStyle === "square") {
      // Merge horizontal runs into single rectangles for a lighter file.
      let c = 0;
      while (c < size) {
        if (!dark(r, c)) {
          c++;
          continue;
        }
        const start = c;
        while (c < size && dark(r, c)) c++;
        dots.rect(ox + start, oy + r, c - start, 1);
      }
      continue;
    }
    for (let c = 0; c < size; c++) {
      if (!dark(r, c)) continue;
      const x = ox + c;
      const y = oy + r;
      const up = dark(r - 1, c);
      const down = dark(r + 1, c);
      const left = dark(r, c - 1);
      const right = dark(r, c + 1);
      switch (design.dotStyle) {
        case "dots":
          dots.circle(x + 0.5, y + 0.5, 0.42);
          break;
        case "diamond":
          dots.diamond(x + 0.5, y + 0.5, 0.56);
          break;
        case "rounded": {
          const rr = 0.5;
          dots.roundedRect(x, y, 1, 1, [
            !up && !left ? rr : 0,
            !up && !right ? rr : 0,
            !down && !right ? rr : 0,
            !down && !left ? rr : 0,
          ]);
          break;
        }
        case "classy": {
          const rr = 0.5;
          dots.roundedRect(x, y, 1, 1, [!up && !left ? rr : 0, 0, !down && !right ? rr : 0, 0]);
          break;
        }
      }
    }
  }
  layers.push({ kind: "path", path: dots, fill: design.fg });

  // --- Finder patterns ("eyes") -------------------------------------------
  const eyeFill: Fill = design.eyeColor ? { type: "solid", color: design.eyeColor } : design.fg;
  const frames = new Path();
  const balls = new Path();
  for (const [er, ec] of [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ]) {
    const x = ox + ec;
    const y = oy + er;
    switch (design.eyeFrameStyle) {
      case "square":
        frames.rect(x, y, 7, 7).rect(x + 1, y + 1, 5, 5);
        break;
      case "rounded":
        frames.roundedRect(x, y, 7, 7, [2.2, 2.2, 2.2, 2.2]).roundedRect(x + 1, y + 1, 5, 5, [1.4, 1.4, 1.4, 1.4]);
        break;
      case "circle":
        frames.circle(x + 3.5, y + 3.5, 3.5).circle(x + 3.5, y + 3.5, 2.5);
        break;
    }
    switch (design.eyeBallStyle) {
      case "square":
        balls.rect(x + 2, y + 2, 3, 3);
        break;
      case "rounded":
        balls.roundedRect(x + 2, y + 2, 3, 3, [1, 1, 1, 1]);
        break;
      case "circle":
        balls.circle(x + 3.5, y + 3.5, 1.5);
        break;
      case "diamond":
        balls.diamond(x + 3.5, y + 3.5, 1.9);
        break;
    }
  }
  layers.push({ kind: "path", path: frames, fill: eyeFill, evenOdd: true });
  layers.push({ kind: "path", path: balls, fill: eyeFill });

  if (logo.dataUrl) {
    layers.push({ kind: "image", x: lx, y: ly, w: logoW, h: logoW, href: logo.dataUrl });
  }

  return {
    width: W,
    height: H,
    gradientBox: { x: ox, y: oy, w: size, h: size },
    layers: [...frameLayers, ...layers],
  };
}
