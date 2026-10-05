export type UrlCheck = { ok: true; url: string; note?: string } | { ok: false; error: string };

/**
 * Normalises what the user typed into the exact URL that will be encoded.
 * Adds https:// when the scheme is missing; otherwise encodes as typed.
 */
export function checkUrl(input: string): UrlCheck {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "Enter a URL to generate a QR code." };
  if (/\s/.test(raw)) return { ok: false, error: "URLs can't contain spaces." };

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  const candidate = hasScheme ? raw : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http:// and https:// links are supported." };
  }
  const host = parsed.hostname;
  if (host !== "localhost" && !/\.[a-z0-9-]{2,}$/i.test(host) && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return { ok: false, error: "Add a domain ending, e.g. example.com." };
  }

  const notes: string[] = [];
  if (!hasScheme) notes.push("https:// was added.");
  if (parsed.protocol === "http:") notes.push("This link isn't secure (http). Use https if the site supports it.");

  // Encode what the user typed (plus scheme). Don't use parsed.href because it
  // can add a trailing slash or re-encode characters.
  return { ok: true, url: candidate, note: notes.join(" ") || undefined };
}
