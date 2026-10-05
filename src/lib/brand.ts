export const APP_NAME = "Fogedit QR";
export const APP_TAGLINE = "Permanent QR codes. No sign-up, no tracking, no expiry.";

/**
 * Public URL of the site, used for canonical links, the sitemap and social
 * previews. Set NEXT_PUBLIC_SITE_URL in the hosting environment.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3123").replace(/\/$/, "");

export const SEO_TITLE = "Free QR Code Generator – No Sign-Up, Never Expires";
export const SEO_DESCRIPTION =
  "Create free QR codes that never expire. Add your logo, colours and frames, then download SVG, PNG, PDF or EPS. No sign-up, no tracking, no redirects.";
