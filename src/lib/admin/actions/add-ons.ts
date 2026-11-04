"use server";

import { redirect } from "next/navigation";
import { CACHE_TAGS, expireCache } from "@/lib/cache-tags";
import { connectDB } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/session";
import { AddOn } from "@/models/add-on";
import { Product } from "@/models/product";
import { checked, text, wholeNumber } from "../form";

const back = (key: "notice" | "error", message: string) => redirect(`/admin/add-ons?${key}=${encodeURIComponent(message)}`);

/** Creates (no id) or updates an add-on from a row on the Add-ons page. */
export async function saveAddOnAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 24);
  const name = text(formData, "name", 40);
  const price = wholeNumber(formData, "price");
  const appliesTo = text(formData, "appliesTo", 10) === "all" ? "all" : "selected";
  if (!name) back("error", "Give the add-on a name.");
  if (!(price >= 0)) back("error", `Enter a whole-peso price for “${name}”.`);

  await connectDB();
  if (id) {
    const updated = await AddOn.findByIdAndUpdate(id, { name, price, appliesTo, isActive: checked(formData, "isActive") });
    if (!updated) back("error", "That add-on no longer exists.");
  } else {
    await AddOn.create({ name, price, appliesTo, isActive: true });
  }
  expireCache(CACHE_TAGS.addOns);
  back("notice", `Saved “${name}”.`);
}

/** Deletes an add-on and unticks it on every product. Past orders keep their own copy of the price. */
export async function deleteAddOnAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 24);
  await connectDB();
  const deleted = await AddOn.findByIdAndDelete(id);
  if (deleted) {
    await Product.updateMany({ addOnIds: deleted._id }, { $pull: { addOnIds: deleted._id } });
    expireCache(CACHE_TAGS.addOns);
  }
  back("notice", deleted ? `Deleted “${deleted.name}”.` : "Add-on already deleted.");
}
