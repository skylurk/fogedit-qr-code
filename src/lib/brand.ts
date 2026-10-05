export const APP_NAME = "Fogedit QR";
export const APP_TAGLINE = "Permanent QR codes. No sign-up, no tracking, no expiry.";

/**
 * Public URL of the site, used for canonical links, the sitemap and social
 * previews. Set NEXT_PUBLIC_SITE_URL in the hosting environment.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3123").replace(/\/$/, "");

export const SEO_TITLE = "Free QR Code Generator – No Sign-Up, Never Expires";
export const SEO_DESCRIPTION =
  "Free QR codes for links, Wi-Fi, contacts, email, SMS and more. Add your logo and colours, download SVG, PNG, PDF or EPS. Never expire, no sign-up.";
