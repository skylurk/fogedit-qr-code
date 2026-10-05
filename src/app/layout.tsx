import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { APP_NAME, SEO_DESCRIPTION, SEO_TITLE, SITE_URL } from "@/lib/brand";
import "./globals.css";

// next/font downloads these at build time and serves them from this site,
// so visitors never make a request to Google.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SEO_TITLE} | ${APP_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
  description: SEO_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "QR code generator",
    "free QR code generator",
    "static QR code",
    "QR code with logo",
    "QR code that never expires",
    "SVG QR code",
    "custom QR code",
    "no sign up QR code",
    "WiFi QR code generator",
    "vCard QR code",
    "contact QR code",
    "email QR code",
    "SMS QR code",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${SEO_TITLE} | ${APP_NAME}`,
    description: SEO_DESCRIPTION,
    url: "/",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SEO_TITLE} | ${APP_NAME}`,
    description: SEO_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#16181d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
              aria-label={`${APP_NAME} home`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M2 2h9v9H2zm2 2v5h5V4zm9-2h9v9h-9zm2 2v5h5V4zM2 13h9v9H2zm2 2v5h5v-5zM5.5 5.5h2v2h-2zm11 0h2v2h-2zm-11 11h2v2h-2zM13 13h3v3h-3zm3 3h3v3h-3zm3-3h3v3h-3zm-6 6h3v3h-3zm6 0h3v3h-3z"
                />
              </svg>
              {APP_NAME}
            </Link>
            <nav aria-label="Main" className="flex gap-1 text-sm">
              <Link href="/" className="rounded-lg px-3 py-1.5 hover:bg-canvas">
                Create
              </Link>
              <Link href="/library" className="rounded-lg px-3 py-1.5 hover:bg-canvas">
                My codes
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-muted">
            <p>
              {APP_NAME} is a free QR code generator. Codes are made in your browser and point straight to your link, so
              they never expire. No accounts and no redirects, and we never track your QR code scans.
            </p>
            <p>© {new Date().getFullYear()} Fogedit</p>
          </div>
        </footer>
        {/* Cookieless page-view counts only. Enable in Vercel → project → Analytics. */}
        <Analytics />
      </body>
    </html>
  );
}
