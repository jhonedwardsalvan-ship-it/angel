import Image from "next/image";
import Link from "next/link";
import { HeartIcon, PlayIcon, TikTokIcon } from "@/components/icons";
import type { StoreTikTokVideo } from "@/lib/tiktok/queries";
import { SectionHeading } from "./section-heading";

const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact" }).format(n);

/** Videos picked in Admin → TikTok. Each opens the full Bloom feed at that video. */
export function TikTokSection({ videos }: { videos: StoreTikTokVideo[] }) {
  if (videos.length === 0) return null;

  return (
    <section className="section" aria-labelledby="tiktok-title">
      <div className="container-page">
        <SectionHeading id="tiktok-title" eyebrow="On TikTok" title="See them in bloom" action={{ label: "Watch all", href: "/bloom" }} />
        <ul className="rail -mx-(--gutter) px-(--gutter) scroll-px-(--gutter) md:mx-0 md:px-0 md:scroll-px-0 lg:auto-cols-[calc((100%-var(--grid-gap)*5)/6)]">
          {videos.map((v) => (
            <li key={v.videoId}>
              <Link href={`/bloom?v=${v.videoId}`} className="group stack gap-2" aria-label={`Watch: ${v.product?.name ?? (v.title || "TikTok video")}`}>
                <div className="media aspect-9/16">
                  {v.coverImage ? (
                    <Image
                      src={v.coverImage}
                      alt=""
                      fill
                      sizes="(min-width: 64rem) 16vw, (min-width: 48rem) 33vw, 46vw"
                      className="transition-transform duration-700 ease-standard group-hover:scale-105"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-ink-muted"><TikTokIcon className="size-10" /></span>
                  )}
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-12 place-items-center rounded-pill bg-canvas/90 text-ink shadow-md transition-transform group-hover:scale-110">
                      <PlayIcon className="ml-0.5" />
                    </span>
                  </span>
                  {v.likeCount > 0 && (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-pill bg-inverse/70 px-2 py-1 text-xs text-ink-inverse">
                      <HeartIcon className="size-3.5" />
                      {compact(v.likeCount)}
                    </span>
                  )}
                </div>
                {v.product ? (
                  <span className="line-clamp-1 text-sm group-hover:underline group-hover:underline-offset-4">{v.product.name}</span>
                ) : (
                  v.title && <span className="line-clamp-2 text-sm text-ink-muted">{v.title}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
