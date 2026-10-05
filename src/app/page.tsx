import Generator from "@/components/Generator";
import { APP_NAME, SEO_DESCRIPTION, SITE_URL } from "@/lib/brand";

const STEPS = [
  [
    "Add your content",
    "Paste a link, or enter Wi-Fi details, a contact card, email, SMS, phone number or text. We check it and show exactly what goes into the code.",
  ],
  [
    "Make it yours",
    "Pick a template or set colours, gradients, dot and corner styles. Add your logo, a frame or a call to action.",
  ],
  [
    "Download",
    "Get a vector SVG, PDF or EPS for print, or a high-resolution PNG for screens. Every design is test-scanned first.",
  ],
];

const FAQS = [
  {
    q: "Is Fogedit QR really free?",
    a: "Yes. There's no sign-up, no subscription, no watermark and no limit on how many QR codes you make or download.",
  },
  {
    q: "Do the QR codes expire?",
    a: "No. Fogedit QR makes static QR codes: your URL is written directly into the code, with no short link or redirect in between. The code keeps working for as long as your website does, even if this site disappears.",
  },
  {
    q: "What's the difference between a static and a dynamic QR code?",
    a: "A dynamic QR code points to the provider's short link, which then redirects to your site. That lets the provider change the destination and count scans, but the code stops working if the service shuts down or your plan ends. A static QR code contains your actual URL, so it can't be switched off. To change where it goes, you make a new code.",
  },
  {
    q: "What can I put in a QR code?",
    a: "Website links, Wi-Fi logins (guests scan to join), contact cards (vCard) that save straight to the phone's contacts, pre-filled emails and text messages, phone numbers to call, and plain text.",
  },
  {
    q: "Can I add my logo to a QR code?",
    a: "Yes. Upload a PNG, JPG, SVG or WebP logo. Fogedit QR switches to the highest error-correction level (H) so the code still scans with part of it covered, limits the logo to a safe size, and test-scans the result.",
  },
  {
    q: "Which file format is best for printing?",
    a: "Use SVG, PDF or EPS for print. They're vector files, so they stay sharp at any size. PNG is best for websites, emails and social media. You can export PNG at a fixed pixel width or at 300 DPI for a chosen print size.",
  },
  {
    q: "How big should I print my QR code?",
    a: "A common rule of thumb is that the code should be at least one-tenth of the scanning distance. For example, around 10 cm wide for scanning from 1 metre. Enter your scanning distance in the download panel and Fogedit QR recommends a minimum size for your code.",
  },
  {
    q: "Do you track scans or store my data?",
    a: "No. QR codes and logos are created entirely in your browser and never uploaded. Codes you save are kept on your own device. Because there's no redirect, we never see when your code is scanned. We only count page visits, anonymously and without cookies, to know how many people use the site.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: APP_NAME,
      url: SITE_URL,
      description: SEO_DESCRIPTION,
      applicationCategory: "DesignApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Static QR codes that never expire",
        "Website, Wi-Fi, vCard contact, email, SMS, phone and text QR codes",
        "Custom colours, gradients, dot and corner styles",
        "Logo upload",
        "Frames and branded QR cards",
        "SVG, PNG, PDF and EPS export",
        "Print size and scan distance calculator",
        "Built-in scan test",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Free QR Code Generator</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Create permanent QR codes for websites, Wi-Fi, contact cards, email, SMS, phone numbers and text, with your
          logo, colours and frame. No sign-up, no expiry and no tracking. Download SVG, PNG, PDF or EPS.
        </p>
      </div>

      <Generator />

      <section aria-labelledby="why" className="mt-12">
        <h2 id="why" className="sr-only">
          Why use {APP_NAME}
        </h2>
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          {[
            [
              "QR codes that never expire",
              "Your URL is written straight into the code. There's no short link or redirect in between, so it keeps working even if this site goes away.",
            ],
            [
              "Private by design",
              "Codes and logos are made in your browser and never uploaded. Saved codes stay on your device.",
            ],
            [
              "Built to scan",
              "Every design is test-scanned as you edit, and the print sizer tells you how big to print for your scanning distance.",
            ],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-line bg-surface p-4">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="how" className="mt-12">
        <h2 id="how" className="text-xl font-semibold tracking-tight">
          How to make a QR code
        </h2>
        <ol className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="rounded-xl border border-line bg-surface p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="static" className="mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 id="static" className="text-xl font-semibold tracking-tight">
            Static vs dynamic QR codes
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Many “free” QR code generators make <strong className="text-ink">dynamic</strong> codes. The code holds
            their short link, which redirects to your page. It works until the trial ends, the plan lapses or the
            company shuts down, and then every printed code breaks at once.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {APP_NAME} only makes <strong className="text-ink">static</strong> codes. The address you type is the
            address in the code, so there&apos;s nothing in the middle to expire or be switched off.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="p-3 font-medium text-muted" scope="col"></th>
                <th className="p-3 font-semibold" scope="col">
                  Static ({APP_NAME})
                </th>
                <th className="p-3 font-semibold" scope="col">
                  Dynamic
                </th>
              </tr>
            </thead>
            <tbody className="[&_td]:p-3 [&_th]:p-3 [&_tr]:border-b [&_tr]:border-line [&_tr:last-child]:border-0">
              <tr>
                <th scope="row" className="font-medium">
                  Expires
                </th>
                <td>Never</td>
                <td>When the service or plan ends</td>
              </tr>
              <tr>
                <th scope="row" className="font-medium">
                  Cost
                </th>
                <td>Free</td>
                <td>Usually a subscription</td>
              </tr>
              <tr>
                <th scope="row" className="font-medium">
                  Scan tracking
                </th>
                <td>None</td>
                <td>Every scan logged</td>
              </tr>
              <tr>
                <th scope="row" className="font-medium">
                  Change link later
                </th>
                <td>Make a new code</td>
                <td>Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="faq" className="mt-12 mb-4">
        <h2 id="faq" className="text-xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group px-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-sm font-semibold">
                <h3>{q}</h3>
                <span aria-hidden className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
