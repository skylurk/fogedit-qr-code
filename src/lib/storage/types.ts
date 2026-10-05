import type { QrDesign } from "@/lib/qr/types";

export interface SavedQr {
  id: string;
  name: string;
  description: string;
  design: QrDesign;
  createdAt: string;
  updatedAt: string;
}

/**
 * Storage boundary for the QR library. V1 uses IndexedDB in the browser;
 * V2 (accounts) can add an API-backed implementation of this same interface
 * without the UI changing.
 */
export interface QrRepository {
  list(): Promise<SavedQr[]>;
  get(id: string): Promise<SavedQr | undefined>;
  save(item: SavedQr): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface LibraryExport {
  app: "fogedit-qr";
  version: 1;
  exportedAt: string;
  items: SavedQr[];
}
