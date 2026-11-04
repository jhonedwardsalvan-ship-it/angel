import "server-only";
import { createHash } from "node:crypto";
import { cloudinaryConfig } from "@/lib/admin/cloudinary";
import { CACHE_TAGS, expireCache } from "@/lib/cache-tags";
import { connectDB } from "@/lib/db/mongoose";
import { TikTokConnection } from "@/models/tiktok-connection";
import { TikTokVideo } from "@/models/tiktok-video";
import { getAccessToken, listVideos, TikTokAuthError, type TikTokApiVideo } from "./client";

/**
 * Copies a TikTok cover into Cloudinary (angel/tiktok/<videoId>), since
 * TikTok's cover links expire after a few hours. Returns "" on failure; the
 * next sync tries again.
 */
async function copyCover(video: TikTokApiVideo) {
  const cfg = cloudinaryConfig();
  if (!cfg || !video.cover_image_url) return "";
  const params: Record<string, string | number> = {
    folder: "angel/tiktok",
    overwrite: "true",
    public_id: video.id,
    timestamp: Math.floor(Date.now() / 1000),
  };
  // Cloudinary signature: params sorted by name, joined as k=v&k=v, then the secret, SHA-1.
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const signature = createHash("sha1").update(toSign + cfg.apiSecret).digest("hex");
  const body = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    file: video.cover_image_url,
    api_key: cfg.apiKey,
    signature,
  });
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, { method: "POST", body });
    const json = await res.json();
    if (!res.ok || !json.secure_url) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
    return json.secure_url as string;
  } catch (e) {
    console.error(`TikTok: couldn't copy cover for ${video.id}`, e);
    return "";
  }
}

/** TikTok's share link, kept only if it really is an https link to tiktok.com (it's rendered as a link on the store). */
function tiktokLink(url: string | undefined) {
  try {
    const u = new URL(url ?? "");
    return u.protocol === "https:" && (u.hostname === "tiktok.com" || u.hostname.endsWith(".tiktok.com")) ? u.toString() : "";
  } catch {
    return "";
  }
}

/** Runs `fn` over `items`, `size` at a time. */
async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}

export type SyncResult = { ok: true; total: number; added: number } | { ok: false; error: string; reconnect: boolean };

/**
 * Pulls the connected account's videos into the store. Adds new ones (hidden
 * until an admin shows them), refreshes titles and counts, copies missing
 * covers, and marks videos that disappeared from TikTok as removed.
 */
export async function syncTikTokVideos(): Promise<SyncResult> {
  await connectDB();
  try {
    const token = await getAccessToken();
    if (!token) return { ok: false, error: "No TikTok account is connected.", reconnect: true };

    const { videos, complete } = await listVideos(token);
    const existing = await TikTokVideo.find({ videoId: { $in: videos.map((v) => v.id) } }, { videoId: 1, coverImage: 1 }).lean();
    const known = new Map(existing.map((v) => [v.videoId, v]));

    await inBatches(videos, 5, async (v) => {
      const coverImage = known.get(v.id)?.coverImage || (await copyCover(v));
      await TikTokVideo.updateOne(
        { videoId: v.id },
        {
          $set: {
            title: (v.title || v.video_description || "").slice(0, 300),
            shareUrl: tiktokLink(v.share_url),
            postedAt: new Date(v.create_time * 1000),
            viewCount: v.view_count ?? 0,
            likeCount: v.like_count ?? 0,
            commentCount: v.comment_count ?? 0,
            coverImage,
            removedAt: null,
          },
        },
        { upsert: true },
      );
    });

    // Only a full list proves a video is gone; a capped one just stopped early.
    if (complete) {
      await TikTokVideo.updateMany(
        { videoId: { $nin: videos.map((v) => v.id) }, removedAt: null },
        { $set: { removedAt: new Date() } },
      );
    }

    // Titles, counts and covers changed; the store shows them on the next visit.
    expireCache(CACHE_TAGS.tiktok);
    await TikTokConnection.updateOne({ key: "store" }, { lastSyncAt: new Date(), lastSyncError: "" });
    return { ok: true, total: videos.length, added: videos.length - known.size };
  } catch (e) {
    const error = e instanceof Error ? e.message : "TikTok sync failed.";
    console.error("TikTok sync failed", e);
    await TikTokConnection.updateOne({ key: "store" }, { lastSyncError: error }).catch(() => {});
    return { ok: false, error, reconnect: e instanceof TikTokAuthError };
  }
}
