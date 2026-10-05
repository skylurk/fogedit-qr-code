import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK =
  "M2 2h9v9H2zm2 2v5h5V4zm9-2h9v9h-9zm2 2v5h5V4zM2 13h9v9H2zm2 2v5h5v-5zM5.5 5.5h2v2h-2zm11 0h2v2h-2zm-11 11h2v2h-2zM13 13h3v3h-3zm3 3h3v3h-3zm3-3h3v3h-3zm-6 6h3v3h-3zm6 0h3v3h-3z";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#16181d",
      }}
    >
      <svg width="116" height="116" viewBox="0 0 24 24">
        <path fill="#ffffff" fillRule="evenodd" d={MARK} />
      </svg>
    </div>,
    size,
  );
}
