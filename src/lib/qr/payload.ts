import { checkUrl } from "./url";

/**
 * What a QR code contains. Each type is turned into the exact text that gets
 * encoded, using formats phone camera apps recognise.
 */
export type Payload =
  | { type: "url"; url: string }
  | { type: "text"; text: string }
  | { type: "wifi"; ssid: string; password: string; security: "WPA" | "WEP" | "nopass"; hidden: boolean }
  | {
      type: "vcard";
      firstName: string;
      lastName: string;
      org: string;
      title: string;
      phone: string;
      email: string;
      website: string;
      street: string;
      city: string;
      region: string;
      postcode: string;
      country: string;
      note: string;
    }
  | { type: "email"; to: string; subject: string; body: string }
  | { type: "sms"; phone: string; message: string }
  | { type: "phone"; phone: string };

export type PayloadType = Payload["type"];

export const PAYLOAD_TYPES: { value: PayloadType; label: string }[] = [
  { value: "url", label: "Website" },
  { value: "text", label: "Text" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "vcard", label: "Contact" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "phone", label: "Phone" },
];

export function emptyPayload(type: PayloadType): Payload {
  switch (type) {
    case "url":
      return { type, url: "" };
    case "text":
      return { type, text: "" };
    case "wifi":
      return { type, ssid: "", password: "", security: "WPA", hidden: false };
    case "vcard":
      return {
        type,
        firstName: "",
        lastName: "",
        org: "",
        title: "",
        phone: "",
        email: "",
        website: "",
        street: "",
        city: "",
        region: "",
        postcode: "",
        country: "",
        note: "",
      };
    case "email":
      return { type, to: "", subject: "", body: "" };
    case "sms":
      return { type, phone: "", message: "" };
    case "phone":
      return { type, phone: "" };
  }
}

export type EncodeResult =
  | { ok: true; text: string; note?: string }
  /** `error` is empty when the form is simply untouched. */
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Keeps a leading + and digits; returns "" if there are too few digits. */
export function cleanPhone(raw: string) {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 3) return "";
  return (trimmed.startsWith("+") ? "+" : "") + digits;
}

// Wi-Fi fields escape \ ; , : and " with a backslash.
const wifiEscape = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
// vCard text values escape \ , ; and newlines.
const vcardEscape = (s: string) =>
  s
    .trim()
    .replace(/([\\,;])/g, "\\$1")
    .replace(/\r?\n/g, "\\n");

export function encodePayload(p: Payload): EncodeResult {
  switch (p.type) {
    case "url": {
      if (!p.url.trim()) return { ok: false, error: "" };
      const r = checkUrl(p.url);
      return r.ok ? { ok: true, text: r.url, note: r.note } : r;
    }
    case "text":
      return p.text.trim() ? { ok: true, text: p.text } : { ok: false, error: "" };

    case "wifi": {
      if (!p.ssid) return { ok: false, error: "" };
      if (p.security !== "nopass" && !p.password) return { ok: false, error: "Enter the Wi-Fi password." };
      if (p.security === "WPA" && p.password.length < 8) {
        return { ok: false, error: "WPA passwords are at least 8 characters." };
      }
      const parts = [`T:${p.security}`, `S:${wifiEscape(p.ssid)}`];
      if (p.security !== "nopass") parts.push(`P:${wifiEscape(p.password)}`);
      if (p.hidden) parts.push("H:true");
      return { ok: true, text: `WIFI:${parts.join(";")};;` };
    }

    case "vcard": {
      const first = p.firstName.trim();
      const last = p.lastName.trim();
      if (!first && !last && !p.org.trim()) return { ok: false, error: "" };
      if (p.email.trim() && !EMAIL_RE.test(p.email.trim())) return { ok: false, error: "Check the email address." };
      const lines = ["BEGIN:VCARD", "VERSION:3.0"];
      lines.push(`N:${vcardEscape(last)};${vcardEscape(first)};;;`);
      lines.push(`FN:${vcardEscape([first, last].filter(Boolean).join(" ") || p.org)}`);
      if (p.org.trim()) lines.push(`ORG:${vcardEscape(p.org)}`);
      if (p.title.trim()) lines.push(`TITLE:${vcardEscape(p.title)}`);
      const phone = cleanPhone(p.phone);
      if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
      if (p.email.trim()) lines.push(`EMAIL:${p.email.trim()}`);
      if (p.website.trim()) {
        const url = checkUrl(p.website);
        lines.push(`URL:${url.ok ? url.url : vcardEscape(p.website)}`);
      }
      const adr = [p.street, p.city, p.region, p.postcode, p.country];
      if (adr.some((a) => a.trim())) lines.push(`ADR;TYPE=WORK:;;${adr.map(vcardEscape).join(";")}`);
      if (p.note.trim()) lines.push(`NOTE:${vcardEscape(p.note)}`);
      lines.push("END:VCARD");
      return { ok: true, text: lines.join("\r\n") };
    }

    case "email": {
      const to = p.to.trim();
      if (!to) return { ok: false, error: "" };
      if (!EMAIL_RE.test(to)) return { ok: false, error: "Check the email address." };
      const q = [
        p.subject.trim() && `subject=${encodeURIComponent(p.subject.trim())}`,
        p.body.trim() && `body=${encodeURIComponent(p.body)}`,
      ].filter(Boolean);
      return { ok: true, text: `mailto:${to}${q.length ? `?${q.join("&")}` : ""}` };
    }

    case "sms": {
      if (!p.phone.trim()) return { ok: false, error: "" };
      const phone = cleanPhone(p.phone);
      if (!phone) return { ok: false, error: "Check the phone number." };
      return { ok: true, text: `SMSTO:${phone}:${p.message}` };
    }

    case "phone": {
      if (!p.phone.trim()) return { ok: false, error: "" };
      const phone = cleanPhone(p.phone);
      if (!phone) return { ok: false, error: "Check the phone number." };
      const note = phone.startsWith("+") ? undefined : "Add the country code (e.g. +44) so it works abroad.";
      return { ok: true, text: `tel:${phone}`, note };
    }
  }
}

/** Short human label, used for default names, filenames and the library. */
export function summarizePayload(p: Payload): string {
  switch (p.type) {
    case "url": {
      const r = checkUrl(p.url);
      return r.ok ? new URL(r.url).hostname : p.url;
    }
    case "text":
      return p.text.trim().split("\n")[0].slice(0, 40);
    case "wifi":
      return `Wi-Fi ${p.ssid}`;
    case "vcard":
      return [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.org.trim();
    case "email":
      return `Email ${p.to.trim()}`;
    case "sms":
      return `SMS ${p.phone.trim()}`;
    case "phone":
      return `Call ${p.phone.trim()}`;
  }
}

/** What the "encodes" preview shows. Hides the Wi-Fi password. */
export function displayEncoded(p: Payload, text: string) {
  if (p.type === "wifi" && p.password) return text.replace(`P:${wifiEscape(p.password)}`, "P:••••••••");
  return text;
}

/** Saved codes from before content types existed only have a URL. */
export function payloadFromSaved(payload: Payload | undefined, content: string): Payload {
  return payload ?? { type: "url", url: content };
}
