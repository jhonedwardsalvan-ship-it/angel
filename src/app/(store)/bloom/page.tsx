import type { Metadata } from "next";
import Link from "next/link";
import { BloomFeed } from "@/components/bloom/bloom-feed";
import { getStoreTikTokVideos } from "@/lib/tiktok/queries";

export const metadata: Metadata = {
  title: "Bloom",
  description: "Watch our bouquets come together on TikTok, and shop the ones you love.",
};

// Videos are picked in Admin → TikTok; show changes right away.
export const dynamic = "force-dynamic";

export default async function BloomPage({ searchParams }: PageProps<"/bloom">) {
  const [{ v }, videos] = await Promise.all([searchParams, getStoreTikTokVideos(50).catch((e) => (console.error("Bloom: couldn't load TikTok videos", e), []))]);

  if (videos.length === 0) {
    return (
      <div className="container-page section stack items-center gap-4 text-center">
        <p className="eyebrow">Bloom</p>
        <h1>New videos are on the way</h1>
        <p className="text-ink-muted">In the meantime, take a look at what&apos;s fresh in the shop.</p>
        <Link href="/collections/new" className="btn btn-primary">Shop new arrivals</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="sr-only">Bloom: our bouquets on TikTok</h1>
      <BloomFeed videos={videos} initialId={typeof v === "string" ? v : undefined} />
    </>
  );
}
