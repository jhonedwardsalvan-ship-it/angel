import Link from "next/link";
import { startingPrice } from "@/lib/catalog/configure";
import { formatPrice } from "@/lib/format";
import type { StoreTikTokVideo } from "@/lib/tiktok/queries";
import { SectionHeading } from "./section-heading";
import { TikTokPlayer } from "./tiktok-player";

/** Videos picked in Admin → TikTok, each with an optional "Shop this" product. */
export function TikTokSection({ videos }: { videos: StoreTikTokVideo[] }) {
  if (videos.length === 0) return null;

  return (
    <section className="section" aria-labelledby="tiktok-title">
      <div className="container-page">
        <SectionHeading id="tiktok-title" eyebrow="On TikTok" title="See them in bloom" />
        <ul className="rail -mx-(--gutter) px-(--gutter) scroll-px-(--gutter) md:mx-0 md:px-0 md:scroll-px-0">
          {videos.map((v) => (
            <li key={v.videoId} className="stack gap-3">
              <div className="media aspect-[9/16]">
                <TikTokPlayer videoId={v.videoId} title={v.title} coverImage={v.coverImage} />
              </div>
              {v.product ? (
                <Link href={`/products/${v.product.slug}`} className="group stack gap-0.5 text-sm">
                  <span className="eyebrow">Shop this</span>
                  <span className="line-clamp-1 group-hover:underline group-hover:underline-offset-4">{v.product.name}</span>
                  <span className="text-ink-muted">
                    {v.product.pricing === "per_piece" ? `From ${formatPrice(startingPrice(v.product))}` : formatPrice(v.product.price)}
                  </span>
                </Link>
              ) : (
                v.title && <p className="line-clamp-2 text-sm text-ink-muted">{v.title}</p>
              )}
              {v.shareUrl && (
                <a href={v.shareUrl} target="_blank" rel="noopener noreferrer" className="link-quiet text-xs">
                  Comments &amp; likes on TikTok
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
