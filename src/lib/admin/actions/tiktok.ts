"use server";

import { Types } from "mongoose";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/session";
import { disconnect } from "@/lib/tiktok/client";
import { syncTikTokVideos } from "@/lib/tiktok/sync";
import { Product } from "@/models/product";
import { TikTokVideo } from "@/models/tiktok-video";

const isObjectId = (id: string) => Types.ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id);
const back = (key: "notice" | "error", message: string) => redirect(`/admin/tiktok?${key}=${encodeURIComponent(message)}`);

export async function syncTikTokAction() {
  await requireAdmin();
  const result = await syncTikTokVideos();
  if (!result.ok) back("error", result.reconnect ? `${result.error} Reconnect TikTok to keep syncing.` : result.error);
  if (result.ok) back("notice", `Synced ${result.total} videos${result.added ? `, ${result.added} new (hidden until you show them)` : ""}.`);
}

// The video manager on Admin → TikTok calls these directly and updates its own
// list, so they return a result instead of redirecting.
export type TikTokVideoResult = { ok: true } | { ok: false; error: string };

const gone: TikTokVideoResult = { ok: false, error: "That video no longer exists. Reload the page." };

/** Shows a video on the store (added at the end of the order) or hides it. */
export async function setTikTokVideoShownAction(id: string, show: boolean): Promise<TikTokVideoResult> {
  await requireAdmin();
  if (!isObjectId(id)) return gone;
  await connectDB();
  let update: Record<string, unknown> = { hidden: true };
  if (show) {
    const last = await TikTokVideo.findOne({ hidden: false }, { sortOrder: 1 }).sort({ sortOrder: -1 }).lean();
    update = { hidden: false, sortOrder: (last?.sortOrder ?? -1) + 1 };
  }
  const updated = await TikTokVideo.findByIdAndUpdate(id, update);
  return updated ? { ok: true } : gone;
}

/** Saves the store order: `ids` are the shown videos, first to last. */
export async function reorderTikTokVideosAction(ids: string[]): Promise<TikTokVideoResult> {
  await requireAdmin();
  if (!Array.isArray(ids) || ids.length > 500 || !ids.every((id) => typeof id === "string" && isObjectId(id))) return gone;
  await connectDB();
  await TikTokVideo.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { sortOrder: i } } } })));
  return { ok: true };
}

/** Links the "Shop this" product, or unlinks it with an empty id. */
export async function setTikTokVideoProductAction(id: string, productId: string): Promise<TikTokVideoResult> {
  await requireAdmin();
  if (!isObjectId(id)) return gone;
  if (productId && !isObjectId(productId)) return { ok: false, error: "Pick a product from the list." };
  await connectDB();
  if (productId && !(await Product.exists({ _id: productId }))) return { ok: false, error: "That product no longer exists. Reload the page." };
  const updated = await TikTokVideo.findByIdAndUpdate(id, { product: productId || null });
  return updated ? { ok: true } : gone;
}

/** Disconnects the account. Synced videos stay, so the store keeps showing them. */
export async function disconnectTikTokAction() {
  await requireAdmin();
  await disconnect();
  back("notice", "TikTok disconnected. Videos already on the store stay until you hide them.");
}
