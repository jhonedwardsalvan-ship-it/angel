import "server-only";
import { createHash } from "node:crypto";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/models/category";
import { Order } from "@/models/order";
import { Product } from "@/models/product";

// Deletes Cloudinary photos that are no longer used, to save storage. Only
// files in this account's angel/ folder are touched, and only when no product,
// category or past order (orders keep their product photo) still shows them.

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

/**
 * "https://res.cloudinary.com/<cloud>/image/upload/v123/angel/products/abc.jpg" → "angel/products/abc".
 * Null for anything that isn't one of our uploads.
 */
export function publicIdFromUrl(url: string, cloudName: string) {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== "res.cloudinary.com") return null;
    const match = pathname.match(new RegExp(`^/${cloudName}/image/upload/(?:v\\d+/)?(angel/[\\w/-]+)\\.[a-z0-9]+$`, "i"));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function stillUsed(url: string) {
  const [product, category, order] = await Promise.all([
    Product.exists({ "images.src": url }),
    Category.exists({ "image.src": url }),
    Order.exists({ "items.image": url }),
  ]);
  return Boolean(product || category || order);
}

async function destroy(publicId: string, { cloudName, apiKey, apiSecret }: NonNullable<ReturnType<typeof config>>) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: apiKey, signature });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json.result !== "ok" && json.result !== "not found")) {
    console.error(`Cloudinary: couldn't delete ${publicId}`, json?.error?.message ?? json.result ?? res.status);
  }
}

/**
 * Deletes the given photos from Cloudinary if nothing uses them any more.
 * Call after the database change is saved (e.g. via after()); failures are
 * only logged, since a leftover file is harmless.
 */
export async function deleteUnusedImages(urls: string[]) {
  const cfg = config();
  if (!cfg) return;
  await connectDB();
  for (const url of new Set(urls)) {
    const publicId = publicIdFromUrl(url, cfg.cloudName);
    if (!publicId || (await stillUsed(url))) continue;
    await destroy(publicId, cfg).catch((e) => console.error("Cloudinary delete failed", e));
  }
}
