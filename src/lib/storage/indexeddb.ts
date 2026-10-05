"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { LibraryExport, QrRepository, SavedQr } from "./types";

const DB_NAME = "fogedit-qr";
const STORE = "codes";

let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE, { keyPath: "id" });
    },
  });
  return dbPromise;
}

export const indexedDbRepository: QrRepository = {
  async list() {
    const items = (await (await db()).getAll(STORE)) as SavedQr[];
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id) {
    return (await db()).get(STORE, id);
  },
  async save(item) {
    await (await db()).put(STORE, item);
  },
  async remove(id) {
    await (await db()).delete(STORE, id);
  },
};

export async function exportLibrary(repo: QrRepository): Promise<LibraryExport> {
  return { app: "fogedit-qr", version: 1, exportedAt: new Date().toISOString(), items: await repo.list() };
}

/** Imports a library backup. Items with the same id are overwritten. */
export async function importLibrary(repo: QrRepository, json: unknown): Promise<number> {
  const data = json as Partial<LibraryExport>;
  if (data?.app !== "fogedit-qr" || !Array.isArray(data.items)) {
    throw new Error("This file isn't a Fogedit QR backup.");
  }
  let count = 0;
  for (const item of data.items) {
    if (item && typeof item.id === "string" && item.design?.content) {
      await repo.save(item);
      count++;
    }
  }
  return count;
}
