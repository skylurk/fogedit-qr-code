import { APP_NAME } from "@/lib/brand";
import type { Fill } from "./types";

/**
 * A tiny vector "scene" that the QR renderer draws into. Keeping our own
 * geometry (instead of going straight to SVG strings) lets the same drawing
 * be written out as SVG and as EPS.
 */

type Cmd =
  ["M", number, number] | ["L", number, number] | ["C", number, number, number, number, number, number] | ["Z"];

// Cubic Bézier constant for approximating quarter circles.
const K = 0.5522847498;

export class Path {
  cmds: Cmd[] = [];

  moveTo(x: number, y: number) {
    this.cmds.push(["M", x, y]);
    return this;
  }
  lineTo(x: number, y: number) {
    this.cmds.push(["L", x, y]);
    return this;
  }
  curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.cmds.push(["C", x1, y1, x2, y2, x, y]);
    return this;
  }
  close() {
    this.cmds.push(["Z"]);
    return this;
  }

  rect(x: number, y: number, w: number, h: number) {
    return this.moveTo(x, y)
      .lineTo(x + w, y)
      .lineTo(x + w, y + h)
      .lineTo(x, y + h)
      .close();
  }

  /** Rectangle with per-corner radii: [topLeft, topRight, bottomRight, bottomLeft]. */
  roundedRect(x: number, y: number, w: number, h: number, r: [number, number, number, number]) {
    const [tl, tr, br, bl] = r;
    this.moveTo(x + tl, y).lineTo(x + w - tr, y);
    if (tr) this.curveTo(x + w - tr + tr * K, y, x + w, y + tr - tr * K, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    if (br) this.curveTo(x + w, y + h - br + br * K, x + w - br + br * K, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    if (bl) this.curveTo(x + bl - bl * K, y + h, x, y + h - bl + bl * K, x, y + h - bl);
    this.lineTo(x, y + tl);
    if (tl) this.curveTo(x, y + tl - tl * K, x + tl - tl * K, y, x + tl, y);
    return this.close();
  }

  circle(cx: number, cy: number, r: number) {
    return this.roundedRect(cx - r, cy - r, r * 2, r * 2, [r, r, r, r]);
  }

  diamond(cx: number, cy: number, r: number) {
    return this.moveTo(cx, cy - r)
      .lineTo(cx + r, cy)
      .lineTo(cx, cy + r)
      .lineTo(cx - r, cy)
      .close();
  }
}

export type Layer =
  | { kind: "path"; path: Path; fill: Fill; evenOdd?: boolean }
  | { kind: "image"; x: number; y: number; w: number; h: number; href: string }
  | {
      kind: "text";
      x: number;
      /** Baseline y. Text is always centred horizontally on x. */
      y: number;
      size: number;
      text: string;
      color: string;
      bold: boolean;
    };

export interface Scene {
  width: number;
  height: number;
  /** Area that gradients stretch across (the QR symbol). */
  gradientBox: { x: number; y: number; w: number; h: number };
  layers: Layer[];
}

const n = (v: number) => +v.toFixed(3);

function pathData(p: Path) {
  return p.cmds
    .map((c) =>
      c[0] === "Z"
        ? "Z"
        : c[0] +
          c
            .slice(1)
            .map((v) => n(v as number))
            .join(" "),
    )
    .join("");
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

/** Colours and hrefs can come from imported files; keep them inert. */
const attr = (s: string) => escapeXml(String(s));
const safeHref = (s: string) => (/^data:image\/[a-z+.-]+;base64,[a-z0-9+/=]+$/i.test(s) ? s : "");

export const FONT_STACK = "Helvetica, Arial, sans-serif";

export interface SvgOptions {
  /** Physical/pixel size attributes, e.g. "50mm" or 1024. Defaults to scene units. */
  width?: string | number;
  height?: string | number;
}

export function sceneToSvg(scene: Scene, opts: SvgOptions = {}): string {
  const defs: string[] = [];
  const body: string[] = [];
  const gradientIds = new Map<string, string>();
  const g = scene.gradientBox;

  const paint = (fill: Fill): string => {
    if (fill.type === "solid") return attr(fill.color);
    const key = JSON.stringify(fill);
    let id = gradientIds.get(key);
    if (!id) {
      id = `g${gradientIds.size}`;
      gradientIds.set(key, id);
      const stops = `<stop offset="0" stop-color="${attr(fill.from)}"/><stop offset="1" stop-color="${attr(fill.to)}"/>`;
      if (fill.type === "linear") {
        const a = (fill.angle * Math.PI) / 180;
        const cx = g.x + g.w / 2;
        const cy = g.y + g.h / 2;
        const half = (Math.abs(Math.cos(a)) * g.w + Math.abs(Math.sin(a)) * g.h) / 2;
        const dx = Math.cos(a) * half;
        const dy = Math.sin(a) * half;
        defs.push(
          `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(cx - dx)}" y1="${n(cy - dy)}" x2="${n(cx + dx)}" y2="${n(cy + dy)}">${stops}</linearGradient>`,
        );
      } else {
        defs.push(
          `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(g.x + g.w / 2)}" cy="${n(g.y + g.h / 2)}" r="${n((g.w / 2) * 1.2)}">${stops}</radialGradient>`,
        );
      }
    }
    return `url(#${id})`;
  };

  for (const layer of scene.layers) {
    if (layer.kind === "path") {
      const rule = layer.evenOdd ? ` fill-rule="evenodd"` : "";
      body.push(`<path d="${pathData(layer.path)}" fill="${paint(layer.fill)}"${rule}/>`);
    } else if (layer.kind === "image") {
      body.push(
        `<image x="${n(layer.x)}" y="${n(layer.y)}" width="${n(layer.w)}" height="${n(layer.h)}" preserveAspectRatio="xMidYMid meet" href="${safeHref(layer.href)}"/>`,
      );
    } else {
      body.push(
        `<text x="${n(layer.x)}" y="${n(layer.y)}" font-family="${FONT_STACK}" font-size="${n(layer.size)}" font-weight="${layer.bold ? 700 : 400}" fill="${attr(layer.color)}" text-anchor="middle">${escapeXml(layer.text)}</text>`,
      );
    }
  }

  const w = opts.width ?? n(scene.width);
  const h = opts.height ?? n(scene.height);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${n(scene.width)} ${n(scene.height)}" shape-rendering="geometricPrecision">` +
    (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
    body.join("") +
    `</svg>`
  );
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const v = parseInt(h.slice(0, 6), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function psColor(hex: string) {
  return (
    hexToRgb(hex)
      .map((c) => n(c / 255))
      .join(" ") + " setrgbcolor"
  );
}

function psString(s: string) {
  return "(" + s.replace(/[^\x20-\x7e]/g, "?").replace(/([()\\])/g, "\\$1") + ")";
}

/**
 * Encapsulated PostScript export. EPS has no practical gradient or embedded
 * image support here, so gradients become their start colour and logos are
 * left out. The UI says so next to the button.
 */
export function sceneToEps(scene: Scene, widthPt: number): string {
  const s = widthPt / scene.width;
  const W = Math.ceil(scene.width * s);
  const H = Math.ceil(scene.height * s);
  const out: string[] = [
    "%!PS-Adobe-3.0 EPSF-3.0",
    `%%BoundingBox: 0 0 ${W} ${H}`,
    `%%Creator: ${APP_NAME}`,
    "%%EndComments",
    "gsave",
    // Flip to a top-left origin so scene coordinates can be used directly.
    `0 ${n(scene.height * s)} translate ${n(s)} ${n(-s)} scale`,
  ];

  for (const layer of scene.layers) {
    if (layer.kind === "path") {
      const color = layer.fill.type === "solid" ? layer.fill.color : layer.fill.from;
      out.push("newpath");
      for (const c of layer.path.cmds) {
        if (c[0] === "M") out.push(`${n(c[1])} ${n(c[2])} moveto`);
        else if (c[0] === "L") out.push(`${n(c[1])} ${n(c[2])} lineto`);
        else if (c[0] === "C")
          out.push(
            `${c
              .slice(1)
              .map((v) => n(v as number))
              .join(" ")} curveto`,
          );
        else out.push("closepath");
      }
      out.push(psColor(color), layer.evenOdd ? "eofill" : "fill");
    } else if (layer.kind === "text") {
      out.push(
        "gsave",
        psColor(layer.color),
        `/${layer.bold ? "Helvetica-Bold" : "Helvetica"} findfont ${n(layer.size)} scalefont setfont`,
        `${n(layer.x)} ${n(layer.y)} translate 1 -1 scale 0 0 moveto`,
        `${psString(layer.text)} dup stringwidth pop 2 div neg 0 rmoveto show`,
        "grestore",
      );
    }
  }

  out.push("grestore", "showpage", "%%EOF");
  return out.join("\n");
}
