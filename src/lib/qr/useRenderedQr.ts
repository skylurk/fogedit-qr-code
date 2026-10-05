"use client";

import { useMemo } from "react";
import { renderQr, type RenderedQr } from "./design";
import type { QrDesign } from "./types";

export function useRenderedQr(design: QrDesign, content: string) {
  return useMemo((): { result: RenderedQr | null; error: string | null } => {
    try {
      return { result: renderQr(design, content), error: null };
    } catch {
      return {
        result: null,
        error: "This is too much content for a QR code at this error-correction level. Shorten it or lower the level.",
      };
    }
  }, [design, content]);
}
