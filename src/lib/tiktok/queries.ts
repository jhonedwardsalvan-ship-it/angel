import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { CACHE_SECONDS, CACHE_TAGS } from "@/lib/cache-tags";
import { getProductsByIds } from "@/lib/catalog/queries";
import { connectDB } from "@/lib/db/mongoose";
import { TikTokConnection } from "@/models/tiktok-connection";
import { TikTokVideo } from "@/models/tiktok-video";
import type { Product } from "@/types/catalog";
import { tiktokConfig } from "./client";

// Values edited by hand in Atlas/Compass can be saved as extended-JSON objects
// ({"$oid": "…"}, {"$date": "…"}) instead of real ObjectIds and Dates. Accept both.
const idOf = (v: unknown) =>
  v == null ? "" : typeof v === "object" && "$oid" in v ? String((v as { $oid: unknown }).$oid) : String(v);
const dateOf = (v: unknown) => new Date(typeof v === "object" && v !== null && "$date" in v ? (v as { $date: string }).$date : (v as Date));

export type TikTokStatus = {
  configured: boolean;
  /** Public (it's in TikTok's login URL); shown so the admin can compare it with the TikTok portal. */
  clientKey: string;
  account: { displayName: string; avatarUrl: string; lastSyncAt: string | null; lastSyncError: string; expired: boolean } | null;
};

/** What the admin TikTok page shows at the top. No tokens. */
export async function getTikTokStatus(): Promise<TikTokStatus> {
  await connectDB();
  const conn = await TikTokConnection.findOne({ key: "store" }, { accessToken: 0, refreshToken: 0 }).lean();
  return {
    configured: tiktokConfig() !== null,
    clientKey: tiktokConfig()?.clientKey ?? "",
    account: conn && {
      displayName: conn.displayName ?? "",
      avatarUrl: conn.avatarUrl ?? "",
      lastSyncAt: conn.lastSyncAt?.toISOString() ?? null,
      lastSyncError: conn.lastSyncError ?? "",
      expired: conn.refreshExpiresAt.getTime() <= Date.now(),
    },
  };
}

export type AdminTikTokVideo = {
  id: string;
  videoId: string;
  title: string;
  shareUrl: string;
  postedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  coverImage: string;
  removed: boolean;
  hidden: boolean;
  productId: string;
  sortOrder: number;
};

/** Every synced video for the admin: shown ones first, then newest. */
export async function listTikTokVideos(): Promise<AdminTikTokVideo[]> {
  await connectDB();
  const rows = await TikTokVideo.find().sort({ hidden: 1, sortOrder: 1, postedAt: -1 }).lean();
  return rows.map((v) => ({
    id: v._id.toString(),
    videoId: v.videoId,
    title: v.title ?? "",
    shareUrl: v.shareUrl ?? "",
    postedAt: dateOf(v.postedAt).toISOString(),
    viewCount: v.viewCount ?? 0,
    likeCount: v.likeCount ?? 0,
    commentCount: v.commentCount ?? 0,
    coverImage: v.coverImage ?? "",
    removed: Boolean(v.removedAt),
    hidden: v.hidden,
    productId: idOf(v.product),
    sortOrder: v.sortOrder ?? 0,
  }));
}

// The shown videos are cached across requests until an admin changes them or a
// sync runs (both call expireCache(CACHE_TAGS.tiktok)).
const tiktokCache = { tags: [CACHE_TAGS.tiktok], revalidate: CACHE_SECONDS };

/** Whether any video is shown on the store, for the "Bloom" menu link. False if the database is down. */
export const hasStoreTikTokVideos = cache(async () => {
  try {
    return await hasShownVideos();
  } catch {
    return false;
  }
});

const hasShownVideos = unstable_cache(async () => {
  await connectDB();
  return Boolean(await TikTokVideo.exists({ hidden: false, removedAt: null }));
}, ["tiktok-has-shown"], tiktokCache);

export type StoreTikTokVideo = {
  videoId: string;
  title: string;
  shareUrl: string;
  coverImage: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  /** "Shop this" product; null when none is linked or it's no longer for sale. */
  product: Product | null;
};

/** The shown videos as plain rows (cacheable), with the linked product's id. */
const getShownVideoRows = unstable_cache(async (limit: number) => {
  await connectDB();
  const rows = await TikTokVideo.find({ hidden: false, removedAt: null })
    .sort({ sortOrder: 1, postedAt: -1 })
    .limit(limit)
    .lean();
  return rows.map((v) => ({
    videoId: v.videoId,
    title: v.title ?? "",
    shareUrl: v.shareUrl ?? "",
    coverImage: v.coverImage ?? "",
    viewCount: v.viewCount ?? 0,
    likeCount: v.likeCount ?? 0,
    commentCount: v.commentCount ?? 0,
    productId: idOf(v.product),
  }));
}, ["tiktok-shown-videos"], tiktokCache);

/** Videos the admin chose to show, in their order, with their linked products (loaded live for current price and stock). */
export async function getStoreTikTokVideos(limit = 12): Promise<StoreTikTokVideo[]> {
  const rows = await getShownVideoRows(limit);
  const productIds = rows.flatMap((v) => (v.productId ? [v.productId] : []));
  const products = productIds.length ? await getProductsByIds(productIds) : [];
  const byId = new Map(products.map((p) => [p.id, p]));
  return rows.map(({ productId, ...v }) => ({ ...v, product: byId.get(productId) ?? null }));
}
