"use server";

import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/session";
import { HIGHLIGHT_ICONS, StoreSettings } from "@/models/store-settings";
import type { AdminFormState } from "@/types/admin";
import { MAX_HIGHLIGHTS, text, wholeNumber } from "../form";

export async function saveSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const rowKeys = Array.from({ length: MAX_HIGHLIGHTS }, (_, i) => [`h${i}Icon`, `h${i}Title`, `h${i}Body`]).flat();
  const values = Object.fromEntries(
    ["deliveryFee", "freeDeliveryMin", "leadDays", ...rowKeys].map((k) => [k, text(formData, k, 300)]),
  );

  const fieldErrors: Record<string, string> = {};
  const deliveryFee = wholeNumber(formData, "deliveryFee");
  const freeDeliveryMin = wholeNumber(formData, "freeDeliveryMin");
  if (!(deliveryFee >= 0)) fieldErrors.deliveryFee = "Enter a whole number, 0 or more.";
  if (!(freeDeliveryMin >= 0)) fieldErrors.freeDeliveryMin = "Enter a whole number, 0 or more.";
  const leadDays = wholeNumber(formData, "leadDays");
  if (!(leadDays >= 1 && leadDays <= 30)) fieldErrors.leadDays = "Enter a number of days from 1 to 30.";

  const productHighlights = [];
  for (let i = 0; i < MAX_HIGHLIGHTS; i++) {
    const icon = values[`h${i}Icon`];
    const title = values[`h${i}Title`].slice(0, 60);
    const body = values[`h${i}Body`].slice(0, 200);
    if (!title) {
      if (body) fieldErrors[`h${i}Title`] = "Add a title, or clear the text to remove this highlight.";
      continue;
    }
    if (!(HIGHLIGHT_ICONS as readonly string[]).includes(icon)) {
      fieldErrors[`h${i}Icon`] = "Choose an icon.";
      continue;
    }
    productHighlights.push({ icon, title, body });
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  await connectDB();
  await StoreSettings.findOneAndUpdate(
    { key: "store" },
    { deliveryFee, freeDeliveryMin, leadDays, productHighlights },
    { upsert: true, runValidators: true },
  );

  redirect(`/admin/settings?notice=${encodeURIComponent("Settings saved.")}`);
}
