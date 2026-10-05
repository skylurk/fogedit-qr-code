# Fogedit QR

A free, permanent QR code generator. The URL is encoded **directly** into the
code: no redirect, no short link, no expiry. Everything runs in the browser:
there are no accounts or tracking, and logos and saved codes never leave the device.

## Run it

```bash
npm install
npm run dev -- --port 3123
```

## Deploy

Set `NEXT_PUBLIC_SITE_URL` to the live URL (see `.env.example`) in your hosting
environment. It drives the canonical link, sitemap, robots.txt and social
previews; without it they point at localhost.

## SEO

- Title, description, Open Graph and Twitter tags (`src/app/layout.tsx`, copy in `src/lib/brand.ts`)
- Generated share image with a real QR code (`src/app/opengraph-image.tsx`)
- `robots.txt`, `sitemap.xml`, web manifest, SVG favicon and Apple touch icon
- JSON-LD `WebApplication` + `FAQPage` structured data and on-page how-to / FAQ content (`src/app/page.tsx`)
- `/library` is `noindex` (its contents are per-device)

## Features

- URL validation (adds `https://` if missing) and shows the exact string that gets encoded
- Error correction L/M/Q/H, quiet zone, dot styles, corner frame/centre styles
- Solid, linear and radial gradient colours; separate corner colour; transparent background
- Logo upload (auto EC H, size capped per EC level, optional dot clearing)
- Label frames and branded cards (title + call to action)
- Templates
- **Live scan test**: every design is decoded with ZXing (WASM, self-hosted from `/public`) as you edit
- Contrast / inverted-colour / quiet-zone warnings
- Print sizing: module size and max scan distance for a print width, and the
  recommended width for a given distance
- Export: SVG (mm-sized), PDF (vector, page = code size), PNG (px or 300 DPI), EPS
  (solid colours only, no logo)
- My codes: save, edit, duplicate, re-download, delete, JSON backup/import (IndexedDB)

## Structure

```
src/lib/qr/         QR engine (framework-free)
  render.ts         design + matrix -> vector scene
  scene.ts          scene -> SVG / EPS
  export.ts         PNG / PDF / downloads / scan test (browser)
  url.ts checks.ts print.ts presets.ts types.ts design.ts
src/lib/storage/    QrRepository interface + IndexedDB implementation
src/components/     Generator, ExportPanel, Library, ui primitives
```

## V2: accounts and a database

The library talks to the `QrRepository` interface in `src/lib/storage/types.ts`.
For V2, add an API-backed implementation (Route Handlers + a database + auth) and
choose it when a user is signed in. The generator and library UI don't need to
change. The JSON backup format can double as the import path from local to account.
