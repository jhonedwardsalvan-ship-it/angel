"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRightIcon, BagIcon, CommentIcon, HeartIcon, PlayIcon, ShareIcon, TikTokIcon } from "@/components/icons";
import { startingPrice } from "@/lib/catalog/configure";
import { formatPrice } from "@/lib/format";
import type { StoreTikTokVideo } from "@/lib/tiktok/queries";

/** Slides this far from the current one are built; farther ones load as you get close. */
const RENDER_AHEAD = 2;

const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact" }).format(n);
const playerSrc = (id: string) => `https://www.tiktok.com/player/v1/${id}?autoplay=1&rel=0&description=0&music_info=0`;

/**
 * Full-height vertical feed, like TikTok: one video per screen, snap
 * scrolling, and only the video in view loads TikTok's player (the rest show
 * their cover), so scrolling stays smooth and only one video plays.
 */
export function BloomFeed({ videos, initialId }: { videos: StoreTikTokVideo[]; initialId?: string }) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(() => Math.max(0, videos.findIndex((v) => v.videoId === initialId)));
  const [notice, setNotice] = useState("");

  const goTo = useCallback((index: number, smooth = true) => {
    const feed = feedRef.current;
    if (!feed) return;
    const i = Math.min(Math.max(index, 0), videos.length - 1);
    feed.scrollTo({ top: i * feed.clientHeight, behavior: smooth ? "smooth" : "instant" });
  }, [videos.length]);

  // Open at the video from ?v= (e.g. a shared link or a tap on the home page).
  useEffect(() => {
    if (active > 0) goTo(active, false);
    // Only on first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The slide that's mostly in view becomes the active (playing) one.
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root: feed, threshold: 0.6 },
    );
    feed.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [videos.length]);

  // Keep the address on the current video so refreshing or copying the URL returns here.
  useEffect(() => {
    const id = videos[active]?.videoId;
    if (id) window.history.replaceState(null, "", `/bloom?v=${id}`);
  }, [active, videos]);

  // ↑/↓ (or k/j) move between videos on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); goTo(active + 1); }
      if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); goTo(active - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const share = async (video: StoreTikTokVideo) => {
    const url = `${window.location.origin}/bloom?v=${video.videoId}`;
    const title = video.product?.name ?? "Angel Flower on TikTok";
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        flash("Link copied");
      }
    } catch {
      // Share sheet closed; nothing to do.
    }
  };

  return (
    <div className="relative">
      <div
        ref={feedRef}
        className="h-[calc(100svh-var(--header-h))] snap-y snap-mandatory overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="TikTok videos"
      >
        {videos.map((video, i) => (
          <section
            key={video.videoId}
            data-index={i}
            aria-label={`Video ${i + 1} of ${videos.length}`}
            className="h-full snap-start snap-always py-3 md:py-6"
          >
            {/* Only slides near the current one get content (covers, buttons, product); the rest stay empty full-height boxes so snapping still works. */}
            {Math.abs(i - active) <= RENDER_AHEAD && (
            <div className="mx-auto flex h-full max-w-6xl justify-center gap-3 px-(--gutter) md:gap-5">
              <div className="flex min-w-0 w-full max-w-md flex-col gap-3 lg:w-auto lg:max-w-none">
                <Frame video={video} playing={i === active} nearby={Math.abs(i - active) <= 1} onPlay={() => goTo(i)} />
                <div className="lg:hidden">
                  <Details video={video} compactLayout />
                </div>
              </div>

              <Actions video={video} onShare={() => share(video)} />

              <aside className="hidden w-80 flex-col justify-end gap-4 pb-2 lg:flex">
                <Details video={video} />
              </aside>
            </div>
            )}
          </section>
        ))}
      </div>

      {/* Desktop: position and ↑/↓ buttons. */}
      <div className="pointer-events-none absolute inset-y-0 right-(--gutter) hidden flex-col items-center justify-center gap-3 xl:flex">
        <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} className="btn-icon pointer-events-auto bg-surface disabled:opacity-30" aria-label="Previous video">
          <ArrowRightIcon className="-rotate-90" />
        </button>
        <span className="text-xs text-ink-muted tabular-nums">{active + 1} / {videos.length}</span>
        <button type="button" onClick={() => goTo(active + 1)} disabled={active === videos.length - 1} className="btn-icon pointer-events-auto bg-surface disabled:opacity-30" aria-label="Next video">
          <ArrowRightIcon className="rotate-90" />
        </button>
      </div>

      <p role="status" aria-live="polite" className={`pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-pill bg-inverse px-4 py-2 text-sm text-ink-inverse transition-opacity ${notice ? "opacity-100" : "opacity-0"}`}>
        {notice}
      </p>
    </div>
  );
}

/** The video: TikTok's player while active, otherwise its cover with a play button. */
function Frame({ video, playing, nearby, onPlay }: { video: StoreTikTokVideo; playing: boolean; nearby: boolean; onPlay: () => void }) {
  const label = video.title || "TikTok video";
  return (
    // lg: 9:16 sized from the slide height (viewport minus header minus the slide's 3rem padding).
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-media bg-inverse lg:h-full lg:w-[calc((100svh-var(--header-h)-3rem)*9/16)] lg:flex-none">
      {video.coverImage ? (
        <Image
          src={video.coverImage}
          alt=""
          fill
          sizes="(min-width: 64rem) 30rem, 100vw"
          loading={nearby ? "eager" : "lazy"}
          className="object-cover"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-ink-inverse/60"><TikTokIcon className="size-12" /></span>
      )}
      {playing ? (
        <iframe
          src={playerSrc(video.videoId)}
          title={label}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button type="button" onClick={onPlay} className="absolute inset-0 grid place-items-center bg-ink/10" aria-label={`Play: ${label}`}>
          <span className="grid size-16 place-items-center rounded-pill bg-canvas/90 text-ink shadow-md">
            <PlayIcon className="ml-0.5 size-7" />
          </span>
        </button>
      )}
    </div>
  );
}

/** Like / comment (on TikTok), share, shop. */
function Actions({ video, onShare }: { video: StoreTikTokVideo; onShare: () => void }) {
  const round = "grid size-12 place-items-center rounded-pill bg-surface text-ink transition-colors hover:bg-surface-strong";
  const item = "flex flex-col items-center gap-1 text-xs text-ink-muted";
  const tiktok = video.shareUrl
    ? { href: video.shareUrl, target: "_blank", rel: "noopener noreferrer" }
    : null;

  return (
    <div className="flex shrink-0 flex-col justify-end gap-5 pb-2 lg:pb-6">
      {tiktok && (
        <>
          <a {...tiktok} className={item} aria-label={`${compact(video.likeCount)} likes. Like on TikTok`}>
            <span className={round}><HeartIcon /></span>
            {compact(video.likeCount)}
          </a>
          <a {...tiktok} className={item} aria-label={`${compact(video.commentCount)} comments. Read and comment on TikTok`}>
            <span className={round}><CommentIcon /></span>
            {compact(video.commentCount)}
          </a>
        </>
      )}
      <button type="button" onClick={onShare} className={item}>
        <span className={round}><ShareIcon /></span>
        Share
      </button>
      {video.product && (
        <Link href={`/products/${video.product.slug}`} className={item}>
          <span className="grid size-12 place-items-center rounded-pill bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"><BagIcon /></span>
          Shop
        </Link>
      )}
    </div>
  );
}

/** Caption and the linked product. */
function Details({ video, compactLayout }: { video: StoreTikTokVideo; compactLayout?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { product } = video;

  return (
    <div className="stack gap-3">
      {video.title && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={`text-left text-sm ${expanded ? "" : compactLayout ? "line-clamp-1" : "line-clamp-3"}`}
          aria-expanded={expanded}
        >
          {video.title}
        </button>
      )}
      {!compactLayout && (
        <p className="text-xs text-ink-muted">{compact(video.viewCount)} views on TikTok</p>
      )}
      {product && (
        <Link href={`/products/${product.slug}`} className="group flex items-center gap-3 rounded-card border border-line bg-canvas p-2 transition-colors hover:border-line-strong">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-control bg-surface-strong">
            {product.images[0] && <Image src={product.images[0].src} alt="" fill sizes="56px" className="object-cover" />}
          </span>
          <span className="stack min-w-0 flex-1 gap-0.5">
            <span className="eyebrow">Shop this</span>
            <span className="line-clamp-1 text-sm group-hover:underline group-hover:underline-offset-4">{product.name}</span>
            <span className="text-sm text-ink-muted">
              {product.pricing === "per_piece" ? `From ${formatPrice(startingPrice(product))}` : formatPrice(product.price)}
            </span>
          </span>
          <ArrowRightIcon className="mr-1 shrink-0 text-ink-muted" />
        </Link>
      )}
    </div>
  );
}
