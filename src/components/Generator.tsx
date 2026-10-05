"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { designWarnings } from "@/lib/qr/checks";
import { normalizeDesign } from "@/lib/qr/design";
import { useRenderedQr } from "@/lib/qr/useRenderedQr";
import { safeFilename, scanTest } from "@/lib/qr/export";
import { PRESETS } from "@/lib/qr/presets";
import {
  DEFAULT_DESIGN,
  MAX_LOGO_SIZE,
  type DotStyle,
  type EcLevel,
  type EyeBallStyle,
  type EyeFrameStyle,
  type Fill,
  type FrameStyle,
  type QrDesign,
} from "@/lib/qr/types";
import {
  displayEncoded,
  emptyPayload,
  encodePayload,
  PAYLOAD_TYPES,
  payloadFromSaved,
  summarizePayload,
  type Payload,
  type PayloadType,
} from "@/lib/qr/payload";
import { indexedDbRepository as repo } from "@/lib/storage/indexeddb";
import { ExportPanel } from "./ExportPanel";
import { PayloadForm } from "./PayloadForm";
import { Button, ColorInput, Field, inputClass, Panel, Segmented, Slider, Toggle } from "./ui";

const PLACEHOLDER_URL = "https://example.com";

const EC_OPTIONS: { value: EcLevel; label: string; title: string }[] = [
  { value: "L", label: "L", title: "Low: ~7% recovery, smallest code" },
  { value: "M", label: "M", title: "Medium: ~15% recovery" },
  { value: "Q", label: "Q", title: "Quartile: ~25% recovery" },
  { value: "H", label: "H", title: "High: ~30% recovery, best for logos and print" },
];

// Built once: preset thumbnails don't depend on the current design.
const PRESET_DESIGNS = PRESETS.map((p) => normalizeDesign({ ...p.design, frame: undefined }));

type ScanStatus = "ok" | "inverted-only" | "fail";

async function readLogo(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  // Keep SVG logos as vectors; shrink large bitmaps so saved codes stay small.
  if (file.type === "image/svg+xml") return dataUrl;
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const max = 600;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  if (scale === 1 && file.type === "image/png") return dataUrl;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export default function Generator() {
  const router = useRouter();
  // One draft per content type, so switching tabs doesn't lose what was typed.
  const [drafts, setDrafts] = useState(
    () =>
      Object.fromEntries(PAYLOAD_TYPES.map(({ value }) => [value, emptyPayload(value)])) as Record<
        PayloadType,
        Payload
      >,
  );
  const [activeType, setActiveType] = useState<PayloadType>("url");
  const [design, setDesign] = useState<QrDesign>(DEFAULT_DESIGN);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [scan, setScan] = useState<{ svg: string; status: ScanStatus } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load a saved code for editing (?id=) or as a new copy (?copy=).
  useEffect(() => {
    // Read on mount rather than via useSearchParams, so the page can be fully
    // prerendered (better for SEO) without a Suspense fallback.
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("id");
    const copyId = params.get("copy");
    const id = editId ?? copyId;
    if (!id) return;
    repo.get(id).then((item) => {
      if (!item) return;
      const payload = payloadFromSaved(item.design.payload, item.design.content);
      setDesign(normalizeDesign(item.design));
      setDrafts((d) => ({ ...d, [payload.type]: payload }));
      setActiveType(payload.type);
      setDescription(item.description);
      setSavedId(editId ? item.id : null);
      setName(editId ? item.name : `${item.name} (copy)`);
    });
  }, []);

  const payload = drafts[activeType];
  const setPayload = (p: Payload) => setDrafts((d) => ({ ...d, [p.type]: p }));
  const encoded = useMemo(() => encodePayload(payload), [payload]);
  const isPlaceholder = !encoded.ok;
  const content = encoded.ok ? encoded.text : PLACEHOLDER_URL;
  const summary = summarizePayload(payload);
  const fullDesign = useMemo(() => ({ ...design, content }), [design, content]);
  const { result, error } = useRenderedQr(fullDesign, content);
  const warnings = useMemo(() => designWarnings(fullDesign), [fullDesign]);

  // Decode the rendered code after each change to make sure it still scans.
  useEffect(() => {
    if (!result || isPlaceholder) return;
    const svg = result.svg;
    let cancelled = false;
    const t = setTimeout(() => {
      scanTest(result.scene, content)
        .catch((): ScanStatus => "fail")
        .then((status) => {
          if (!cancelled) setScan({ svg, status });
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [result, content, isPlaceholder]);
  const scanStatus = result && scan?.svg === result.svg ? scan.status : "checking";

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const set = <K extends keyof QrDesign>(key: K, value: QrDesign[K]) => setDesign((d) => ({ ...d, [key]: value }));
  const setLogo = (patch: Partial<QrDesign["logo"]>) => setDesign((d) => ({ ...d, logo: { ...d.logo, ...patch } }));
  const setFrame = (patch: Partial<QrDesign["frame"]>) => setDesign((d) => ({ ...d, frame: { ...d.frame, ...patch } }));

  const setEc = (ecLevel: EcLevel) =>
    setDesign((d) => ({ ...d, ecLevel, logo: { ...d.logo, size: Math.min(d.logo.size, MAX_LOGO_SIZE[ecLevel]) } }));

  const fgPrimary = design.fg.type === "solid" ? design.fg.color : design.fg.from;
  const setFillType = (type: Fill["type"]) => {
    const fg = design.fg;
    const from = fg.type === "solid" ? fg.color : fg.from;
    const to = fg.type === "solid" ? "#0e7490" : fg.to;
    set(
      "fg",
      type === "solid"
        ? { type, color: from }
        : type === "linear"
          ? { type, from, to, angle: fg.type === "linear" ? fg.angle : 45 }
          : { type, from, to },
    );
  };

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("Please choose an image file.");
      return;
    }
    const dataUrl = await readLogo(file);
    setDesign((d) => ({
      ...d,
      ecLevel: "H",
      logo: { ...d.logo, dataUrl, size: Math.min(d.logo.size, MAX_LOGO_SIZE.H) },
    }));
  };

  const makePrintReady = () => setDesign((d) => ({ ...d, ecLevel: "H", margin: Math.max(4, d.margin) }));

  const save = async (asNew: boolean) => {
    if (!encoded.ok) return;
    const now = new Date().toISOString();
    const existing = !asNew && savedId ? await repo.get(savedId) : undefined;
    const id = existing?.id ?? crypto.randomUUID();
    await repo.save({
      id,
      name: name.trim() || summary,
      description: description.trim(),
      design: { ...design, content: encoded.text, payload },
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    setSavedId(id);
    if (!name.trim()) setName(summary);
    router.replace(`/?id=${id}`, { scroll: false });
    setToast(existing ? "Changes saved" : "Saved to My codes");
  };

  const filename = encoded.ok ? safeFilename(name || summary) : "qr-code";
  const printReady = design.ecLevel === "H" && design.margin >= 4;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      {/* Content */}
      <section
        aria-label="QR code content"
        className="space-y-4 rounded-xl border border-line bg-surface p-4 max-lg:order-1 lg:col-start-1 lg:row-start-1"
      >
        <Segmented<PayloadType>
          label="Content type"
          value={activeType}
          onChange={setActiveType}
          options={PAYLOAD_TYPES}
        />
        <PayloadForm value={payload} onChange={setPayload} />
        <div className="min-h-5 text-xs">
          {!encoded.ok && encoded.error && <span className="text-red-600">{encoded.error}</span>}
          {encoded.ok &&
            (payload.type === "url" ? (
              <span className="text-muted">
                Encodes exactly <span className="font-mono break-all text-ink">{encoded.text}</span>
                {encoded.note && <span className="text-amber-700"> · {encoded.note}</span>}
              </span>
            ) : (
              <details className="text-muted">
                <summary className="cursor-pointer">
                  Encodes {encoded.text.length} characters
                  {encoded.note && <span className="text-amber-700"> · {encoded.note}</span>}
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-canvas p-2 font-mono break-all whitespace-pre-wrap text-ink">
                  {displayEncoded(payload, encoded.text)}
                </pre>
              </details>
            ))}
        </div>
      </section>

      {/* Preview + export + save. On mobile the aside dissolves so the
          customisation panels can sit between the preview and the downloads. */}
      <aside className="space-y-4 max-lg:contents lg:sticky lg:top-4 lg:col-start-2 lg:row-span-3 lg:row-start-1">
        <div className="rounded-xl border border-line bg-surface p-4 max-lg:order-2">
          <div
            className={`relative flex min-h-[300px] w-full items-center justify-center rounded-lg ${
              design.transparentBg ? "checkerboard" : "bg-canvas"
            }`}
          >
            {result ? (
              <div
                className={`flex w-full justify-center p-4 transition-opacity [&>svg]:h-auto [&>svg]:max-h-[420px] [&>svg]:w-full [&>svg]:max-w-[320px] ${isPlaceholder ? "opacity-25" : ""}`}
                // SVG is generated by our own renderer with escaped values.
                dangerouslySetInnerHTML={{ __html: result.svg }}
              />
            ) : (
              <p className="p-6 text-center text-sm text-red-600">{error}</p>
            )}
            {isPlaceholder && result && (
              <p className="absolute rounded-full bg-white px-3 py-1.5 text-sm font-medium shadow-sm">
                Fill in the details to create your code
              </p>
            )}
          </div>

          {result && !isPlaceholder && (
            <div className="mt-3 space-y-2">
              <ScanBadge status={scanStatus} />
              <p className="text-center text-xs text-muted">
                Version {result.matrix.version} · {result.matrix.size}×{result.matrix.size} modules · EC{" "}
                {design.ecLevel}
              </p>
            </div>
          )}
          {!isPlaceholder && warnings.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {warnings.map((w) => (
                <li
                  key={w.message}
                  className={`rounded-md px-2.5 py-1.5 text-xs ${
                    w.level === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {w.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="max-lg:order-4">
          <Panel title="Download">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
              <div className="text-xs">
                <div className="font-semibold">Print-ready</div>
                <div className="text-muted">EC level H, quiet zone of 4+ modules</div>
              </div>
              {printReady ? (
                <span className="text-xs font-semibold text-emerald-700">✓ Ready</span>
              ) : (
                <Button onClick={makePrintReady} className="shrink-0 px-2.5 py-1.5 text-xs">
                  Apply
                </Button>
              )}
            </div>
            <ExportPanel
              scene={result?.scene ?? null}
              filename={filename}
              disabled={isPlaceholder || !result}
              hasGradientOrLogo={design.fg.type !== "solid" || !!design.logo.dataUrl}
            />
          </Panel>
        </div>

        <div className="max-lg:order-5">
          <Panel title={savedId ? "Saved code" : "Save to My codes"}>
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={encoded.ok ? summary : "e.g. Shop window poster"}
                className={inputClass}
              />
            </Field>
            <Field label="Description (optional)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </Field>
            <div className="flex gap-2">
              <Button variant="primary" disabled={!encoded.ok} onClick={() => save(false)} className="flex-1">
                {savedId ? "Save changes" : "Save"}
              </Button>
              {savedId && (
                <Button disabled={!encoded.ok} onClick={() => save(true)}>
                  Save as new
                </Button>
              )}
            </div>
            <p className="text-xs text-muted">
              Saved only in this browser. Nothing is uploaded.{" "}
              <Link href="/library" className="underline">
                My codes
              </Link>
            </p>
          </Panel>
        </div>
      </aside>

      {/* Customisation */}
      <div className="space-y-4 max-lg:order-3 lg:col-start-1 lg:row-start-2">
        <Panel title="Templates">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {PRESETS.map((p, i) => (
              <PresetButton
                key={p.id}
                name={p.name}
                onClick={() =>
                  setDesign((d) => ({
                    ...d,
                    ...p.design,
                    ecLevel: d.logo.dataUrl ? "H" : p.design.ecLevel,
                    frame: { ...d.frame, ...p.design.frame },
                  }))
                }
                design={PRESET_DESIGNS[i]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Style">
          <Field label="Dots">
            <Segmented<DotStyle>
              label="Dot style"
              value={design.dotStyle}
              onChange={(v) => set("dotStyle", v)}
              options={[
                { value: "square", label: "Square" },
                { value: "rounded", label: "Rounded" },
                { value: "dots", label: "Dots" },
                { value: "classy", label: "Classy" },
                { value: "diamond", label: "Diamond" },
              ]}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Corner frames">
              <Segmented<EyeFrameStyle>
                label="Corner frame style"
                value={design.eyeFrameStyle}
                onChange={(v) => set("eyeFrameStyle", v)}
                options={[
                  { value: "square", label: "Square" },
                  { value: "rounded", label: "Rounded" },
                  { value: "circle", label: "Circle" },
                ]}
              />
            </Field>
            <Field label="Corner centres">
              <Segmented<EyeBallStyle>
                label="Corner centre style"
                value={design.eyeBallStyle}
                onChange={(v) => set("eyeBallStyle", v)}
                options={[
                  { value: "square", label: "Square" },
                  { value: "rounded", label: "Rounded" },
                  { value: "circle", label: "Circle" },
                  { value: "diamond", label: "Diamond" },
                ]}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Error correction" hint="Higher levels survive damage and logos but make the code denser.">
              <Segmented<EcLevel>
                label="Error correction"
                value={design.ecLevel}
                onChange={setEc}
                options={EC_OPTIONS}
              />
            </Field>
            <Field label="Quiet zone (margin)" hint="4 modules is the standard.">
              <Slider
                label="Quiet zone"
                min={0}
                max={10}
                value={design.margin}
                onChange={(v) => set("margin", v)}
                format={(v) => `${v} mod`}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Colours">
          <Field label="Code colour">
            <Segmented<Fill["type"]>
              label="Fill type"
              value={design.fg.type}
              onChange={setFillType}
              options={[
                { value: "solid", label: "Solid" },
                { value: "linear", label: "Linear gradient" },
                { value: "radial", label: "Radial gradient" },
              ]}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {design.fg.type === "solid" ? (
              <ColorInput
                label="Code colour"
                value={design.fg.color}
                onChange={(color) => set("fg", { type: "solid", color })}
              />
            ) : (
              <>
                <ColorInput
                  label="Gradient start"
                  value={design.fg.from}
                  onChange={(from) => set("fg", { ...(design.fg as Exclude<Fill, { type: "solid" }>), from })}
                />
                <ColorInput
                  label="Gradient end"
                  value={design.fg.to}
                  onChange={(to) => set("fg", { ...(design.fg as Exclude<Fill, { type: "solid" }>), to })}
                />
              </>
            )}
          </div>
          {design.fg.type === "linear" && (
            <Field label="Gradient angle">
              <Slider
                label="Gradient angle"
                min={0}
                max={360}
                step={15}
                value={design.fg.angle}
                onChange={(angle) => set("fg", { ...(design.fg as Extract<Fill, { type: "linear" }>), angle })}
                format={(v) => `${v}°`}
              />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Corner colour">
              <div className="space-y-2">
                <Toggle checked={design.eyeColor !== null} onChange={(on) => set("eyeColor", on ? fgPrimary : null)}>
                  Use a separate colour
                </Toggle>
                {design.eyeColor !== null && (
                  <ColorInput label="Corner colour" value={design.eyeColor} onChange={(v) => set("eyeColor", v)} />
                )}
              </div>
            </Field>
            <Field label="Background">
              <div className="space-y-2">
                <Toggle checked={design.transparentBg} onChange={(v) => set("transparentBg", v)}>
                  Transparent
                </Toggle>
                {!design.transparentBg && (
                  <ColorInput label="Background" value={design.bg} onChange={(v) => set("bg", v)} />
                )}
              </div>
            </Field>
          </div>
        </Panel>

        <Panel title="Logo" defaultOpen={false}>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => {
              onLogo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {design.logo.dataUrl ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={design.logo.dataUrl}
                alt="Logo"
                className="h-12 w-12 rounded border border-line object-contain"
              />
              <Button onClick={() => fileRef.current?.click()}>Replace</Button>
              <Button variant="ghost" onClick={() => setLogo({ dataUrl: null })}>
                Remove
              </Button>
            </div>
          ) : (
            <Button onClick={() => fileRef.current?.click()}>Upload logo</Button>
          )}
          <p className="text-xs text-muted">
            PNG, JPG, SVG or WebP. The logo stays on your device. Adding one sets error correction to H.
          </p>
          {design.logo.dataUrl && (
            <>
              <Field
                label="Logo size"
                hint={`Max ${Math.round(MAX_LOGO_SIZE[design.ecLevel] * 100)}% at EC ${design.ecLevel}.`}
              >
                <Slider
                  label="Logo size"
                  min={0.1}
                  max={MAX_LOGO_SIZE[design.ecLevel]}
                  step={0.01}
                  value={design.logo.size}
                  onChange={(size) => setLogo({ size })}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
              </Field>
              <Toggle checked={design.logo.excavate} onChange={(excavate) => setLogo({ excavate })}>
                Clear the dots behind the logo
              </Toggle>
            </>
          )}
        </Panel>

        <Panel title="Frame & card" defaultOpen={false}>
          <Segmented<FrameStyle>
            label="Frame style"
            value={design.frame.style}
            onChange={(style) => setFrame({ style })}
            options={[
              { value: "none", label: "None" },
              { value: "label-bottom", label: "Label below" },
              { value: "label-top", label: "Label above" },
              { value: "card", label: "Branded card" },
            ]}
          />
          {design.frame.style !== "none" && (
            <>
              {design.frame.style === "card" && (
                <Field label="Title">
                  <input
                    value={design.frame.title}
                    maxLength={40}
                    onChange={(e) => setFrame({ title: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              )}
              <Field label={design.frame.style === "card" ? "Call to action" : "Label"}>
                <input
                  value={design.frame.text}
                  maxLength={40}
                  onChange={(e) => setFrame({ text: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <div className="flex flex-wrap gap-4">
                <Field label={design.frame.style === "card" ? "Card colour" : "Frame colour"}>
                  <ColorInput
                    label="Frame colour"
                    value={design.frame.color}
                    onChange={(color) => setFrame({ color })}
                  />
                </Field>
                <Field label="Text colour">
                  <ColorInput
                    label="Text colour"
                    value={design.frame.textColor}
                    onChange={(textColor) => setFrame({ textColor })}
                  />
                </Field>
              </div>
            </>
          )}
        </Panel>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function ScanBadge({ status }: { status: ScanStatus | "checking" }) {
  const map = {
    checking: ["bg-canvas text-muted", "Checking it scans…"],
    ok: ["bg-emerald-50 text-emerald-700", "✓ Scan test passed"],
    "inverted-only": ["bg-amber-50 text-amber-800", "Only scans in some apps (inverted colours)"],
    fail: ["bg-red-50 text-red-700", "✕ Doesn't scan. Increase contrast, shrink the logo or raise EC."],
  } as const;
  const [cls, text] = map[status];
  return <div className={`rounded-md px-2.5 py-1.5 text-center text-xs font-medium ${cls}`}>{text}</div>;
}

function PresetButton({ name, design, onClick }: { name: string; design: QrDesign; onClick: () => void }) {
  const { result } = useRenderedQr(design, "https://qr.example");
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-1 rounded-lg border border-line bg-white p-1.5 hover:border-ink/40"
    >
      {result && (
        <div className="w-full [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: result.svg }} />
      )}
      <span className="text-[11px] leading-tight text-muted group-hover:text-ink">{name}</span>
    </button>
  );
}
