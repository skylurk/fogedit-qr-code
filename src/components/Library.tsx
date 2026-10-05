"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { normalizeDesign, renderQr } from "@/lib/qr/design";
import { download, exportPng, exportSvg, safeFilename } from "@/lib/qr/export";
import { exportLibrary, importLibrary, indexedDbRepository as repo } from "@/lib/storage/indexeddb";
import type { SavedQr } from "@/lib/storage/types";
import { Button } from "./ui";

export default function Library() {
  const [items, setItems] = useState<SavedQr[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => repo.list().then(setItems);
  useEffect(() => {
    refresh();
  }, []);

  const remove = async (item: SavedQr) => {
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    await repo.remove(item.id);
    refresh();
  };

  const backup = async () => {
    const data = await exportLibrary(repo);
    const date = new Date().toISOString().slice(0, 10);
    download(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `fogedit-qr-backup-${date}.json`);
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const count = await importLibrary(repo, JSON.parse(await file.text()));
      setMessage(`Imported ${count} code${count === 1 ? "" : "s"}.`);
      refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My codes</h1>
          <p className="text-sm text-muted">
            Stored in this browser only. Clearing site data removes them, so download a backup now and then.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              restore(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileRef.current?.click()}>Import backup</Button>
          <Button onClick={backup} disabled={!items?.length}>
            Download backup
          </Button>
        </div>
      </div>
      {message && <p className="rounded-lg bg-canvas px-3 py-2 text-sm">{message}</p>}

      {items === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="font-medium">No saved codes yet</p>
          <p className="mt-1 text-sm text-muted">Codes you save show up here.</p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
            Create a QR code
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <LibraryCard key={item.id} item={item} onDelete={() => remove(item)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LibraryCard({ item, onDelete }: { item: SavedQr; onDelete: () => void }) {
  const design = normalizeDesign(item.design);
  let rendered: ReturnType<typeof renderQr> | null = null;
  try {
    rendered = renderQr(design, design.content);
  } catch {
    rendered = null;
  }
  const filename = safeFilename(item.name || design.content);

  return (
    <li className="flex flex-col rounded-xl border border-line bg-surface p-4">
      <div className={`mb-3 rounded-lg p-3 ${design.transparentBg ? "checkerboard" : "bg-canvas"}`}>
        {rendered ? (
          <div
            className="mx-auto max-w-[180px] [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: rendered.svg }}
          />
        ) : (
          <p className="text-center text-sm text-red-600">Can&apos;t render this code</p>
        )}
      </div>
      <h2 className="truncate font-semibold">{item.name}</h2>
      <a
        href={design.content}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate font-mono text-xs text-muted hover:text-ink hover:underline"
      >
        {design.content}
      </a>
      {item.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{item.description}</p>}
      <p className="mt-1.5 text-xs text-muted">
        Created {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
      </p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        <Link
          href={`/?id=${item.id}`}
          className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink/85"
        >
          Edit
        </Link>
        <Link
          href={`/?copy=${item.id}`}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:border-ink/40"
        >
          Duplicate
        </Link>
        <Button disabled={!rendered} onClick={() => rendered && exportSvg(rendered.scene, filename)}>
          SVG
        </Button>
        <Button disabled={!rendered} onClick={() => rendered && exportPng(rendered.scene, filename, 1024)}>
          PNG
        </Button>
        <Button variant="ghost" onClick={onDelete} className="ml-auto text-red-600">
          Delete
        </Button>
      </div>
    </li>
  );
}
