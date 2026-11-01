import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedDots, BloomingFlower } from "@/components/layout/blooming";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Flowering soon · AL",
  robots: { index: false },
};

/**
 * Shown for any page that doesn't exist (yet). It renders outside the (store)
 * layout, so it adds the store header and footer itself.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center">
        <div className="container-narrow stack items-center gap-6 py-20 text-center md:py-28">
          <BloomingFlower />
          <p className="eyebrow">Coming soon</p>
          <h1 className="text-h1" aria-label="Flowering soon">
            Flowering soon
            <AnimatedDots />
          </h1>
          <p className="max-w-sm text-ink-muted">
            This page is still growing. We&apos;re arranging something beautiful here, so check back soon.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="btn btn-primary">Back to the shop</Link>
            <Link href="/orders" className="btn btn-outline">Track an order</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
