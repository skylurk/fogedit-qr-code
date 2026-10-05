"use client";

import { useState } from "react";
import { exportEps, exportPdf, exportPng, exportSvg } from "@/lib/qr/export";
import { formatDistance, maxDistanceForWidth, minWidthForDistance, moduleSizeMm, MIN_PRINT_MM } from "@/lib/qr/print";
import type { Scene } from "@/lib/qr/scene";
import { Button, Field, inputClass } from "./ui";

const PNG_SIZES = [512, 1024, 2048, 4096];

export function ExportPanel({
  scene,
  filename,
  disabled,
  hasGradientOrLogo,
}: {
  scene: Scene | null;
  filename: string;
  disabled: boolean;
  hasGradientOrLogo: boolean;
}) {
  const [widthMm, setWidthMm] = useState(50);
  const [distanceM, setDistanceM] = useState(1);
  const [png, setPng] = useState<string>("1024");
  const [busy, setBusy] = useState<string | null>(null);

  const modules = scene?.width ?? 33;
  const dpiPx = Math.round((widthMm / 25.4) * 300);
  const recommendedMm = Math.ceil(minWidthForDistance(distanceM * 1000, modules));

  const run = async (kind: string, fn: () => Promise<void> | void) => {
    if (!scene) return;
    setBusy(kind);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Print width (mm)">
          <input
            type="number"
            min={MIN_PRINT_MM}
            max={2000}
            value={widthMm}
            onChange={(e) => setWidthMm(Math.max(1, Number(e.target.value) || 0))}
            className={inputClass}
          />
        </Field>
        <Field label="Scan distance (m)">
          <input
            type="number"
            min={0.1}
            max={50}
            step={0.1}
            value={distanceM}
            onChange={(e) => setDistanceM(Math.max(0.1, Number(e.target.value) || 0))}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="rounded-lg bg-canvas p-3 text-xs leading-relaxed text-muted">
        At <b className="text-ink">{widthMm} mm</b>, each module is {moduleSizeMm(widthMm, modules).toFixed(2)} mm and
        the code scans reliably from up to{" "}
        <b className="text-ink">{formatDistance(maxDistanceForWidth(widthMm, modules))}</b>.
        {widthMm < recommendedMm ? (
          <div className="mt-1.5 flex items-center justify-between gap-2 text-amber-700">
            <span>
              For {distanceM} m, print at least {recommendedMm} mm wide.
            </span>
            <button type="button" className="font-semibold underline" onClick={() => setWidthMm(recommendedMm)}>
              Use {recommendedMm} mm
            </button>
          </div>
        ) : (
          <div className="mt-1.5 text-emerald-700">Large enough for {distanceM} m.</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="primary"
          disabled={disabled || !!busy}
          onClick={() => run("svg", () => exportSvg(scene!, filename, { widthMm }))}
        >
          {busy === "svg" ? "Saving…" : "SVG"}
        </Button>
        <Button disabled={disabled || !!busy} onClick={() => run("pdf", () => exportPdf(scene!, filename, widthMm))}>
          {busy === "pdf" ? "Saving…" : "PDF"}
        </Button>
        <div className="col-span-2 flex gap-2">
          <select
            aria-label="PNG resolution"
            value={png}
            onChange={(e) => setPng(e.target.value)}
            className={`${inputClass} flex-1`}
          >
            {PNG_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} px wide
              </option>
            ))}
            <option value="dpi">
              300 DPI at {widthMm} mm ({dpiPx} px)
            </option>
          </select>
          <Button
            disabled={disabled || !!busy}
            onClick={() => run("png", () => exportPng(scene!, filename, png === "dpi" ? dpiPx : Number(png)))}
            className="w-24"
          >
            {busy === "png" ? "Saving…" : "PNG"}
          </Button>
        </div>
        <Button
          className="col-span-2"
          disabled={disabled || !!busy}
          onClick={() => run("eps", () => exportEps(scene!, filename, widthMm))}
        >
          EPS
        </Button>
      </div>
      <p className="text-xs text-muted">
        SVG, PDF and EPS are vector files sized to the print width.
        {hasGradientOrLogo && " EPS uses solid colours and leaves out the logo."}
      </p>
    </div>
  );
}
