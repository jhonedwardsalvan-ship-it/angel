import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Suspense } from "react";
import { NavigationOverlay } from "@/components/layout/navigation-overlay";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AL Flower Shop",
  description: "Handcrafted flowers and gifts that last, from AL Flower Shop",
  other: {
    "google-adsense-account": "ca-pub-9341622931460129",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* useSearchParams needs a Suspense boundary; the overlay renders nothing until a navigation starts. */}
        <Suspense fallback={null}>
          <NavigationOverlay />
        </Suspense>
      </body>
    </html>
  );
}
