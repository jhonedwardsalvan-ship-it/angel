"use server";

import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/session";
import { Color } from "@/models/color";
import { Product } from "@/models/product";
import { checked, text } from "../form";

const back = (key: "notice" | "error", message: string) => redirect(`/admin/colors?${key}=${encodeURIComponent(message)}`);

/** Creates (no id) or updates a color from a row on the Colors page. */
export async function saveColorAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 24);
  const name = text(formData, "name", 30);
  const hex = text(formData, "hex", 7).toLowerCase();
  if (!name) back("error", "Give the color a name.");
  if (!/^#[0-9a-f]{6}$/.test(hex)) back("error", `Pick a swatch color for “${name}”.`);

  await connectDB();
  if (id) {
    const updated = await Color.findByIdAndUpdate(id, { name, hex, isActive: checked(formData, "isActive") });
    if (!updated) back("error", "That color no longer exists.");
  } else {
    await Color.create({ name, hex, isActive: true });
  }
  back("notice", `Saved “${name}”.`);
}

/** Deletes a color and unticks it on every product. Past orders keep the color name they were placed with. */
export async function deleteColorAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 24);
  await connectDB();
  const deleted = await Color.findByIdAndDelete(id);
  if (deleted) {
    // strict: false also clears the legacy colorIds list, which isn't in the schema any more.
    const lists = ["flowerColorIds", "wrapperColorIds", "colorIds"];
    await Product.updateMany(
      { $or: lists.map((k) => ({ [k]: deleted._id })) },
      { $pull: Object.fromEntries(lists.map((k) => [k, deleted._id])) },
      { strict: false },
    );
  }
  back("notice", deleted ? `Deleted “${deleted.name}”.` : "Color already deleted.");
}
