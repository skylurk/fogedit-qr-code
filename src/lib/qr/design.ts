import { buildMatrix, renderDesign, type QrMatrix } from "./render";
import { sceneToSvg, type Scene } from "./scene";
import { DEFAULT_DESIGN, type QrDesign } from "./types";

/** Fills in any fields missing from older or imported designs. */
export function normalizeDesign(d: Partial<QrDesign> | undefined): QrDesign {
  return {
    ...DEFAULT_DESIGN,
    ...d,
    logo: { ...DEFAULT_DESIGN.logo, ...d?.logo },
    frame: { ...DEFAULT_DESIGN.frame, ...d?.frame },
  };
}

export interface RenderedQr {
  matrix: QrMatrix;
  scene: Scene;
  svg: string;
}

export function renderQr(design: QrDesign, content: string): RenderedQr {
  const matrix = buildMatrix(content, design.ecLevel);
  const scene = renderDesign(design, matrix);
  return { matrix, scene, svg: sceneToSvg(scene) };
}
