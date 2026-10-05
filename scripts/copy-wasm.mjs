// Copies the ZXing decoder into /public so the scan test loads it from this
// site rather than a CDN. Runs before `dev` and `build`.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

// Resolve through the package's exports so this works wherever npm puts it.
const src = createRequire(import.meta.url).resolve("zxing-wasm/reader/zxing_reader.wasm");

// public/ may not exist in a fresh clone: git doesn't keep empty folders.
mkdirSync("public", { recursive: true });
copyFileSync(src, "public/zxing_reader.wasm");
