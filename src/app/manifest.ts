import type { MetadataRoute } from "next";
import { APP_NAME, SEO_DESCRIPTION } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} – Free QR Code Generator`,
    short_name: APP_NAME,
    description: SEO_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#16181d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
