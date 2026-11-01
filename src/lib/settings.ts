import "server-only";
import { cache } from "react";
import { connectDB } from "@/lib/db/mongoose";
import { formatPrice } from "@/lib/format";
import { StoreSettings as StoreSettingsModel, type HIGHLIGHT_ICONS } from "@/models/store-settings";

export type HighlightIcon = (typeof HIGHLIGHT_ICONS)[number];
export type Highlight = { icon: HighlightIcon; title: string; body: string };
export type StoreSettings = {
  deliveryFee: number;
  freeDeliveryMin: number;
  leadDays: number;
  productHighlights: Highlight[];
};

/** Used until an admin saves the settings page for the first time. */
export const DEFAULT_SETTINGS: StoreSettings = {
  deliveryFee: 150,
  freeDeliveryMin: 2500,
  leadDays: 3,
  productHighlights: [
    { icon: "truck", title: "Book ahead", body: "— order at least {leadDays} days before your date. Free delivery over {freeDeliveryMin}." },
    { icon: "card", title: "Free message card", body: ", handwritten and tucked into the wrap." },
  ],
};

/** Store settings with defaults filled in. Cached per request. */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  await connectDB();
  const doc = await StoreSettingsModel.findOne({ key: "store" }).lean();
  if (!doc) return DEFAULT_SETTINGS;
  return {
    deliveryFee: doc.deliveryFee,
    freeDeliveryMin: doc.freeDeliveryMin,
    leadDays: doc.leadDays ?? DEFAULT_SETTINGS.leadDays,
    productHighlights: doc.productHighlights.map(({ icon, title, body }) => ({
      icon: icon as HighlightIcon,
      title,
      body: body ?? "",
    })),
  };
});

/** Replaces {deliveryFee}, {freeDeliveryMin} and {leadDays} in admin-written text with current values. */
export function fillSettingsTokens(text: string, settings: StoreSettings) {
  return text
    .replaceAll("{deliveryFee}", formatPrice(settings.deliveryFee))
    .replaceAll("{freeDeliveryMin}", formatPrice(settings.freeDeliveryMin))
    .replaceAll("{leadDays}", String(settings.leadDays));
}
