import "server-only";
import { getProductsByIds } from "@/lib/catalog/queries";
import { connectDB } from "@/lib/db/mongoose";
import { TikTokConnection } from "@/models/tiktok-connection";
import { TikTokVideo } from "@/models/tiktok-video";
import type { Product } from "@/types/catalog";
import { tiktokConfig } from "./client";

export type TikTokStatus = {
  configured: boolean;
  account: { displayName: string; avatarUrl: string; lastSyncAt: string | null; lastSyncError: string; expired: boolean } | null;
};

/** What the admin TikTok page shows at the top. No tokens. */
export async function getTikTokStatus(): Promise<TikTokStatus> {
  await connectDB();
  const conn = await TikTokConnection.findOne({ key: "store" }, { accessToken: 0, refreshToken: 0 }).lean();
  return {
    configured: tiktokConfig() !== null,
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
    postedAt: v.postedAt.toISOString(),
    viewCount: v.viewCount ?? 0,
    likeCount: v.likeCount ?? 0,
    commentCount: v.commentCount ?? 0,
    coverImage: v.coverImage ?? "",
    removed: Boolean(v.removedAt),
    hidden: v.hidden,
    productId: v.product?.toString() ?? "",
    sortOrder: v.sortOrder ?? 0,
  }));
}

export type StoreTikTokVideo = {
  videoId: string;
  title: string;
  shareUrl: string;
  coverImage: string;
  likeCount: number;
  commentCount: number;
  /** "Shop this" product; null when none is linked or it's no longer for sale. */
  product: Product | null;
};

/** Videos the admin chose to show, in their order, with their linked products. */
export async function getStoreTikTokVideos(limit = 12): Promise<StoreTikTokVideo[]> {
  await connectDB();
  const rows = await TikTokVideo.find({ hidden: false, removedAt: null })
    .sort({ sortOrder: 1, postedAt: -1 })
    .limit(limit)
    .lean();
  const productIds = rows.flatMap((v) => (v.product ? [v.product.toString()] : []));
  const products = productIds.length ? await getProductsByIds(productIds) : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  return rows.map((v) => ({
    videoId: v.videoId,
    title: v.title ?? "",
    shareUrl: v.shareUrl ?? "",
    coverImage: v.coverImage ?? "",
    likeCount: v.likeCount ?? 0,
    commentCount: v.commentCount ?? 0,
    product: (v.product && byId.get(v.product.toString())) || null,
  }));
}
