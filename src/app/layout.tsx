import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Suspense } from "react";
import { NavigationOverlay } from "@/components/layout/navigation-overlay";
import { env } from "@/lib/env";
import { SITE } from "@/lib/site";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Turns relative og:image/og:url paths into the absolute links chat apps need.
  metadataBase: new URL(env.BETTER_AUTH_URL),
  title: "AL Flower Shop",
  description: "Handcrafted flowers and gifts that last, from AL Flower Shop",
  openGraph: { type: "website", siteName: SITE.name, locale: "en_PH" },
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
