import "server-only";
import { revalidateTag } from "next/cache";

// Cross-request cache for storefront data that changes only when an admin
// edits it (categories, settings, add-ons, colors, TikTok picks). Products,
// stock and prices are never cached here: they must always be live.
//
// Every admin action that changes one of these must call expireCache() with
// its tag. CACHE_SECONDS is only a safety net for changes made outside the
// admin (e.g. editing the database by hand).

export const CACHE_TAGS = {
  categories: "categories",
  settings: "settings",
  addOns: "add-ons",
  colors: "colors",
  tiktok: "tiktok-videos",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export const CACHE_SECONDS = 60 * 60;

/** Drops cached data right away, so the next page load reads the database (admins see their change at once). */
export function expireCache(...tags: CacheTag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}
