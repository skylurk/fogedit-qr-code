import type { Metadata } from "next";
import Library from "@/components/Library";

export const metadata: Metadata = {
  title: "My codes",
  description: "QR codes you've saved in this browser.",
  // Contents are per-device, so there's nothing useful to index.
  robots: { index: false, follow: true },
  alternates: { canonical: "/library" },
};

export default function LibraryPage() {
  return <Library />;
}
