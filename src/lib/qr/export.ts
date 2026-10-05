"use client";

import { sceneToEps, sceneToSvg, type Scene } from "./scene";

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFilename(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "qr-code"
  );
}

/** Rasterises a scene to a canvas at the given pixel width. */
export async function sceneToCanvas(
  scene: Scene,
  widthPx: number,
  opts: { whiteBackdrop?: boolean } = {},
): Promise<HTMLCanvasElement> {
  const heightPx = Math.round((widthPx * scene.height) / scene.width);
  const svg = sceneToSvg(scene, { width: widthPx, height: heightPx });
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d")!;
    if (opts.whiteBackdrop) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, widthPx, heightPx);
    }
    ctx.drawImage(img, 0, 0, widthPx, heightPx);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface PhysicalSize {
  /** Width of the whole graphic in millimetres. */
  widthMm: number;
}

const mmToPt = (mm: number) => (mm * 72) / 25.4;

export function exportSvg(scene: Scene, filename: string, physical?: PhysicalSize) {
  const svg = physical
    ? sceneToSvg(scene, {
        width: `${physical.widthMm}mm`,
        height: `${+((physical.widthMm * scene.height) / scene.width).toFixed(3)}mm`,
      })
    : sceneToSvg(scene, { width: 1024, height: Math.round((1024 * scene.height) / scene.width) });
  download(new Blob([svg], { type: "image/svg+xml" }), `${filename}.svg`);
}

export async function exportPng(scene: Scene, filename: string, widthPx: number) {
  const canvas = await sceneToCanvas(scene, widthPx);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (blob) download(blob, `${filename}.png`);
}

/** Vector PDF whose page is exactly the size of the graphic. */
export async function exportPdf(scene: Scene, filename: string, widthMm: number) {
  const [{ jsPDF }] = await Promise.all([import("jspdf"), import("svg2pdf.js")]);
  const heightMm = (widthMm * scene.height) / scene.width;
  const doc = new jsPDF({
    unit: "mm",
    format: [widthMm, heightMm],
    orientation: widthMm > heightMm ? "landscape" : "portrait",
  });
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-10000px;top:0;";
  holder.innerHTML = sceneToSvg(scene);
  document.body.appendChild(holder);
  try {
    await doc.svg(holder.firstElementChild!, { x: 0, y: 0, width: widthMm, height: heightMm });
    download(doc.output("blob"), `${filename}.pdf`);
  } finally {
    holder.remove();
  }
}

export function exportEps(scene: Scene, filename: string, widthMm: number) {
  const eps = sceneToEps(scene, mmToPt(widthMm));
  download(new Blob([eps], { type: "application/postscript" }), `${filename}.eps`);
}

let zxingReady = false;

async function zxing() {
  const mod = await import("zxing-wasm/reader");
  if (!zxingReady) {
    // Serve the decoder from this site (copied to /public by the predev and
    // prebuild scripts) instead of the library's default CDN.
    mod.prepareZXingModule({
      overrides: { locateFile: (path, prefix) => (path.endsWith(".wasm") ? `/${path}` : prefix + path) },
    });
    zxingReady = true;
  }
  return mod;
}

/**
 * Renders the design the way a phone camera would see it and decodes it with
 * ZXing (the decoder used by many scanner apps). Passes only if it decodes
 * to exactly the expected content.
 */
export async function scanTest(scene: Scene, expected: string): Promise<"ok" | "inverted-only" | "fail"> {
  const { readBarcodes } = await zxing();
  const canvas = await sceneToCanvas(scene, 640, { whiteBackdrop: true });
  const image = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  const read = async (tryInvert: boolean) => {
    const results = await readBarcodes(image, {
      formats: ["QRCode"],
      tryHarder: true,
      tryInvert,
      maxNumberOfSymbols: 1,
    });
    return results.find((r) => r.isValid && r.text === expected);
  };
  if (await read(false)) return "ok";
  const inverted = await read(true);
  return inverted?.isInverted ? "inverted-only" : inverted ? "ok" : "fail";
}
