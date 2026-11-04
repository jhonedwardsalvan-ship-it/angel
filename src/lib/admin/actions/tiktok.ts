"use server";

import { Types } from "mongoose";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/session";
import { disconnect } from "@/lib/tiktok/client";
import { syncTikTokVideos } from "@/lib/tiktok/sync";
import { Product } from "@/models/product";
import { TikTokVideo } from "@/models/tiktok-video";
import { checked, text, wholeNumber } from "../form";

const isObjectId = (id: string) => Types.ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id);
const back = (key: "notice" | "error", message: string) => redirect(`/admin/tiktok?${key}=${encodeURIComponent(message)}`);

export async function syncTikTokAction() {
  await requireAdmin();
  const result = await syncTikTokVideos();
  if (!result.ok) back("error", result.reconnect ? `${result.error} Reconnect TikTok to keep syncing.` : result.error);
  if (result.ok) back("notice", `Synced ${result.total} videos${result.added ? `, ${result.added} new (hidden until you show them)` : ""}.`);
}

/** Saves one video row: shown on the store or not, its "Shop this" product, and its position. */
export async function saveTikTokVideoAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 24);
  const productId = text(formData, "productId", 24);
  const sortOrder = wholeNumber(formData, "sortOrder");
  if (!isObjectId(id)) back("error", "That video no longer exists.");
  if (productId && !isObjectId(productId)) back("error", "Pick a product from the list.");

  await connectDB();
  if (productId && !(await Product.exists({ _id: productId }))) back("error", "That product no longer exists.");
  const updated = await TikTokVideo.findByIdAndUpdate(id, {
    hidden: !checked(formData, "show"),
    product: productId || null,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  });
  if (!updated) back("error", "That video no longer exists.");
  back("notice", "Video saved.");
}

/** Disconnects the account. Synced videos stay, so the store keeps showing them. */
export async function disconnectTikTokAction() {
  await requireAdmin();
  await disconnect();
  back("notice", "TikTok disconnected. Videos already on the store stay until you hide them.");
}
