import { ImageResponse } from "next/og";
import { APP_NAME, SITE_URL } from "@/lib/brand";
import { normalizeDesign, renderQr } from "@/lib/qr/design";

export const alt = `${APP_NAME} – free QR code generator. No sign-up, never expires.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  // A real, scannable code for the site, drawn by the app's own renderer.
  const design = normalizeDesign({
    ecLevel: "Q",
    fg: { type: "linear", from: "#0c4a6e", to: "#0e7490", angle: 45 },
    dotStyle: "rounded",
    eyeFrameStyle: "rounded",
    eyeBallStyle: "circle",
    margin: 2,
  });
  const { svg } = renderQr(design, SITE_URL);
  const qrSrc = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#f4f5f7",
        color: "#16181d",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: "#0e7490" }}>{APP_NAME}</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 18, letterSpacing: -2 }}>
          Free QR Code Generator
        </div>
        <div style={{ fontSize: 32, color: "#4b5059", marginTop: 28, lineHeight: 1.35 }}>
          Permanent codes with your logo and colours. No sign-up, no tracking, no expiry.
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 36 }}>
          {["SVG", "PNG", "PDF", "EPS"].map((f) => (
            <div
              key={f}
              style={{
                fontSize: 24,
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: 12,
                border: "2px solid #d5d8dd",
                background: "#ffffff",
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          padding: 28,
          borderRadius: 36,
          background: "#ffffff",
          boxShadow: "0 20px 50px rgba(22,24,29,0.12)",
        }}
      >
        <img src={qrSrc} width={380} height={380} alt="" />
      </div>
    </div>,
    size,
  );
}
