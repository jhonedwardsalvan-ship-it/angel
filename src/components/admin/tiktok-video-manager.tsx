"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowRightIcon } from "@/components/icons";
import {
  reorderTikTokVideosAction,
  setTikTokVideoProductAction,
  setTikTokVideoShownAction,
  type TikTokVideoResult,
} from "@/lib/admin/actions/tiktok";
import type { AdminTikTokVideo } from "@/lib/tiktok/queries";

type Product = { id: string; name: string };
type Tab = "store" | "all";

const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact" }).format(n);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" });

/** Shown videos first, in store order. */
const storeOrder = (videos: AdminTikTokVideo[]) =>
  videos.filter((v) => !v.hidden && !v.removed).sort((a, b) => a.sortOrder - b.sortOrder);

/**
 * Admin → TikTok video list. "On store" holds the shown videos in store order
 * (drag, or ↑/↓, to reorder; pick each one's product). "All videos" ticks
 * videos on and off the store. Every change saves right away.
 */
export function TikTokVideoManager({ videos: initial, products }: { videos: AdminTikTokVideo[]; products: Product[] }) {
  const [videos, setVideos] = useState(initial);
  const [tab, setTab] = useState<Tab>(() => (storeOrder(initial).length ? "store" : "all"));
  const [status, setStatus] = useState<{ kind: "saving" | "saved" | "error"; message: string } | null>(null);
  const [, startTransition] = useTransition();

  const shown = storeOrder(videos);

  /** Applies a change locally right away, saves it, and puts the list back if saving fails. */
  const save = (next: AdminTikTokVideo[], action: () => Promise<TikTokVideoResult>) => {
    const before = videos;
    setVideos(next);
    setStatus({ kind: "saving", message: "Saving…" });
    startTransition(async () => {
      const result = await action().catch(() => ({ ok: false as const, error: "Couldn't save. Check your connection and try again." }));
      if (result.ok) setStatus({ kind: "saved", message: "Saved" });
      else {
        setVideos(before);
        setStatus({ kind: "error", message: result.error });
      }
    });
  };

  const toggle = (video: AdminTikTokVideo, show: boolean) => {
    const sortOrder = show ? (shown.at(-1)?.sortOrder ?? -1) + 1 : video.sortOrder;
    save(
      videos.map((v) => (v.id === video.id ? { ...v, hidden: !show, sortOrder } : v)),
      () => setTikTokVideoShownAction(video.id, show),
    );
  };

  const reorder = (orderedIds: string[]) => {
    const position = new Map(orderedIds.map((id, i) => [id, i]));
    save(
      videos.map((v) => (position.has(v.id) ? { ...v, sortOrder: position.get(v.id)! } : v)),
      () => reorderTikTokVideosAction(orderedIds),
    );
  };

  const link = (video: AdminTikTokVideo, productId: string) =>
    save(
      videos.map((v) => (v.id === video.id ? { ...v, productId } : v)),
      () => setTikTokVideoProductAction(video.id, productId),
    );

  if (videos.length === 0) return null;

  const tabClass = (t: Tab) =>
    `-mb-px border-b-2 px-1 pb-3 text-sm transition-colors ${tab === t ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"}`;

  return (
    <section aria-label="Videos" className="stack gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <div role="tablist" aria-label="Videos" className="flex gap-6">
          <button type="button" role="tab" aria-selected={tab === "store"} onClick={() => setTab("store")} className={tabClass("store")}>
            On store ({shown.length})
          </button>
          <button type="button" role="tab" aria-selected={tab === "all"} onClick={() => setTab("all")} className={tabClass("all")}>
            All videos ({videos.length})
          </button>
        </div>
        <p
          role="status"
          aria-live="polite"
          className={`pb-3 text-xs ${status?.kind === "error" ? "text-danger" : "text-ink-muted"}`}
        >
          {status?.message}
        </p>
      </div>

      {tab === "store" ? (
        <StoreTab videos={shown} products={products} onReorder={reorder} onLink={link} onRemove={(v) => toggle(v, false)} onBrowse={() => setTab("all")} />
      ) : (
        <AllTab videos={videos} onToggle={toggle} />
      )}
    </section>
  );
}

/** A small Cloudinary thumbnail instead of the full-size cover (the list can hold hundreds). */
const thumbnail = (url: string) =>
  url.startsWith("https://res.cloudinary.com/") ? url.replace("/image/upload/", "/image/upload/c_fill,w_240,f_auto,q_auto/") : url;

function Cover({ video, className }: { video: AdminTikTokVideo; className: string }) {
  return (
    <div className={`relative aspect-9/16 shrink-0 overflow-hidden rounded-control bg-surface-strong ${className}`}>
      {video.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview
        <img src={thumbnail(video.coverImage)} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" draggable={false} />
      )}
    </div>
  );
}

const PAGE_SIZE = 24;

/** Renders `PAGE_SIZE` more items each time the sentinel below the list scrolls into view. */
function useLoadMore(total: number) {
  const [count, setCount] = useState(PAGE_SIZE);
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!sentinel || count >= total) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setCount((c) => Math.min(c + PAGE_SIZE, total)),
      { rootMargin: "600px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, count, total]);
  return { count, sentinelRef: setSentinel, showMore: () => setCount((c) => Math.min(c + PAGE_SIZE, total)) };
}

function StoreTab({
  videos,
  products,
  onReorder,
  onLink,
  onRemove,
  onBrowse,
}: {
  videos: AdminTikTokVideo[];
  products: Product[];
  onReorder: (ids: string[]) => void;
  onLink: (video: AdminTikTokVideo, productId: string) => void;
  onRemove: (video: AdminTikTokVideo) => void;
  onBrowse: () => void;
}) {
  // While dragging, the list is previewed in its new order; it's saved on drop.
  const [preview, setPreview] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const ids = preview ?? videos.map((v) => v.id);
  const byId = new Map(videos.map((v) => [v.id, v]));
  const original = videos.map((v) => v.id).join();

  const move = (list: string[], id: string, to: number) => {
    const next = list.filter((x) => x !== id);
    next.splice(Math.max(0, Math.min(to, next.length)), 0, id);
    return next;
  };

  const finishDrag = () => {
    if (preview && preview.join() !== original) onReorder(preview);
    setPreview(null);
    setDragId(null);
  };

  if (videos.length === 0) {
    return (
      <div className="panel stack items-start gap-3 text-sm">
        <p className="text-ink-muted">No videos on the store yet. Tick the ones you want in “All videos”.</p>
        <button type="button" onClick={onBrowse} className="btn btn-outline btn-sm">Choose videos</button>
      </div>
    );
  }

  return (
    <div className="stack gap-3">
      <p className="text-xs text-ink-muted">Drag to change the order on the store (first = shown first). On a phone, use the arrows.</p>
      <ol className="stack gap-2">
        {ids.map((id, i) => {
          const video = byId.get(id)!;
          const dragging = dragId === id;
          return (
            <li
              key={id}
              draggable
              onDragStart={(e) => {
                setDragId(id);
                e.dataTransfer.effectAllowed = "move";
                setPreview(videos.map((v) => v.id));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                const from = dragId;
                if (from && from !== id) setPreview((list) => (list ? move(list, from, list.indexOf(id)) : list));
              }}
              onDrop={(e) => {
                e.preventDefault();
                finishDrag();
              }}
              onDragEnd={finishDrag}
              className={`panel flex items-center gap-3 p-3 transition-opacity ${dragging ? "opacity-40" : ""}`}
            >
              <span className="hidden cursor-grab text-ink-subtle select-none active:cursor-grabbing sm:block" aria-hidden="true" title="Drag to reorder">
                ⠿
              </span>
              <span className="w-5 text-center text-sm text-ink-muted tabular-nums">{i + 1}</span>
              <Cover video={video} className="w-12" />
              <div className="stack min-w-0 flex-1 gap-2">
                <p className="line-clamp-1 text-sm">{video.title || "Untitled video"}</p>
                <select
                  value={video.productId}
                  onChange={(e) => onLink(video, e.target.value)}
                  aria-label={`“Shop this” product for video ${i + 1}`}
                  className="input max-w-sm py-1.5 text-sm"
                >
                  <option value="">No product linked</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" onClick={() => onReorder(move(videos.map((v) => v.id), id, i - 1))} disabled={i === 0} className="btn-icon size-8 disabled:opacity-30" aria-label={`Move video ${i + 1} up`}>
                  <ArrowRightIcon className="size-4 -rotate-90" />
                </button>
                <button type="button" onClick={() => onReorder(move(videos.map((v) => v.id), id, i + 1))} disabled={i === ids.length - 1} className="btn-icon size-8 disabled:opacity-30" aria-label={`Move video ${i + 1} down`}>
                  <ArrowRightIcon className="size-4 rotate-90" />
                </button>
              </div>
              <button type="button" onClick={() => onRemove(video)} className="link shrink-0 text-xs text-danger">
                Remove
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AllTab({ videos, onToggle }: { videos: AdminTikTokVideo[]; onToggle: (video: AdminTikTokVideo, show: boolean) => void }) {
  const sorted = [...videos].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  const { count, sentinelRef, showMore } = useLoadMore(sorted.length);
  return (
    <div className="stack gap-3">
      <p className="text-xs text-ink-muted">Tick a video to add it to the store. It goes to the end of “On store”, where you can move it.</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {sorted.slice(0, count).map((video) => {
          const onStore = !video.hidden && !video.removed;
          return (
            <li key={video.id}>
              <label
                className={`panel stack h-full cursor-pointer gap-2 p-2 transition-colors ${onStore ? "border-ink" : ""} ${video.removed ? "cursor-not-allowed opacity-60" : "hover:border-line-strong"}`}
              >
                <div className="relative">
                  <Cover video={video} className="w-full" />
                  <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-pill bg-canvas/95 px-2 py-1 text-xs shadow-sm">
                    <input
                      type="checkbox"
                      checked={onStore}
                      disabled={video.removed}
                      onChange={(e) => onToggle(video, e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    {onStore ? "On store" : "Add"}
                  </span>
                </div>
                <span className="line-clamp-2 text-xs">{video.title || "Untitled video"}</span>
                <span className="mt-auto text-xs text-ink-muted">
                  {formatDate(video.postedAt)} · {compact(video.viewCount)} views · {compact(video.likeCount)} likes
                </span>
                {video.removed ? (
                  <span className="text-xs text-danger">No longer on TikTok</span>
                ) : (
                  video.shareUrl && (
                    <a href={video.shareUrl} target="_blank" rel="noopener noreferrer" className="link text-xs" onClick={(e) => e.stopPropagation()}>
                      Open on TikTok
                    </a>
                  )
                )}
              </label>
            </li>
          );
        })}
      </ul>
      {count < sorted.length && (
        // Loads the next batch automatically when scrolled near; the button is a fallback.
        <div ref={sentinelRef} className="flex justify-center py-2">
          <button type="button" onClick={showMore} className="btn btn-outline btn-sm">
            Show more ({sorted.length - count} left)
          </button>
        </div>
      )}
    </div>
  );
}
