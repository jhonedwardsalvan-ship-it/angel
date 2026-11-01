"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { setStock } from "@/lib/inventory";
import { requireAdmin } from "@/lib/session";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { Category } from "@/models/category";
import { Product } from "@/models/product";
import type { AdminFormState } from "@/types/admin";
import { MAX_PIECES } from "@/lib/catalog/configure";
import { AddOn } from "@/models/add-on";
import { Color } from "@/models/color";
import { deleteUnusedImages } from "../cloudinary";
import { checked, isAllowedImageUrl, isDuplicateKey, parseImageLines, text, uploadedThisEdit, wholeNumber } from "../form";

export async function saveProductAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const session = await requireAdmin();
  const id = text(formData, "id", 24);
  const values = Object.fromEntries(
    ["name", "slug", "category", "price", "compareAtPrice", "stock", "description", "details", "images", "pricing", "minPieces"].map((k) => [k, text(formData, k, 4000)]),
  );
  for (const k of ["isActive", "isFeatured", "isNewArrival", "madeToOrder"]) values[k] = checked(formData, k) ? "on" : "";

  const fieldErrors: Record<string, string> = {};
  const name = values.name.slice(0, 120);
  const slug = slugify(values.slug || name);
  const price = wholeNumber(formData, "price");
  const compareAtPrice = values.compareAtPrice ? wholeNumber(formData, "compareAtPrice") : undefined;
  const stock = id ? undefined : values.stock ? wholeNumber(formData, "stock") : 0;
  const details = values.details.split("\n").map((d) => d.trim()).filter(Boolean).slice(0, 12);
  const images = parseImageLines(values.images).slice(0, 8);

  if (!name) fieldErrors.name = "Enter a product name.";
  if (!SLUG_PATTERN.test(slug)) fieldErrors.slug = "Use lowercase letters, numbers and hyphens.";
  if (!(price >= 0)) fieldErrors.price = "Enter a whole number of pesos, 0 or more.";
  if (compareAtPrice !== undefined && !(compareAtPrice > price)) {
    fieldErrors.compareAtPrice = "Must be a whole number higher than the price, or empty.";
  }
  if (stock !== undefined && !(stock >= 0)) fieldErrors.stock = "Enter a whole number, 0 or more.";
  const pricing: "fixed" | "per_piece" = values.pricing === "per_piece" ? "per_piece" : "fixed";
  const minPieces = pricing === "per_piece" ? wholeNumber(formData, "minPieces") : 5;
  if (pricing === "per_piece" && !(minPieces >= 1 && minPieces <= MAX_PIECES)) fieldErrors.minPieces = "Enter a whole number of flowers, 1 or more.";
  // Ticked shared add-ons; unknown ids are ignored.
  const tickedAddOns = formData.getAll("addOnIds").map(String).filter((id) => /^[a-f0-9]{24}$/i.test(id)).slice(0, 50);
  values.addOnIds = tickedAddOns.join(",");
  const tickedColors = formData.getAll("colorIds").map(String).filter((id) => /^[a-f0-9]{24}$/i.test(id)).slice(0, 100);
  values.colorIds = tickedColors.join(",");

  if (images.length === 0) fieldErrors.images = "Upload at least one photo.";
  else if (images.some((img) => !isAllowedImageUrl(img.src))) {
    fieldErrors.images = "One of the photos has an invalid link. Remove it and upload it again.";
  } else if (images.some((img) => !img.alt)) {
    fieldErrors.images = "Add a short description under every photo.";
  }

  await connectDB();
  const category = /^[a-f0-9]{24}$/i.test(values.category) ? await Category.exists({ _id: values.category }) : null;
  if (!category) fieldErrors.category = "Choose a category.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const data = {
    name,
    slug,
    category: values.category,
    pricing,
    price,
    minPieces,
    madeToOrder: pricing === "per_piece" || values.madeToOrder === "on",
    colorIds: tickedColors.length ? (await Color.find({ _id: { $in: tickedColors } }, { _id: 1 }).lean()).map((c) => c._id) : [],
    addOnIds: tickedAddOns.length ? (await AddOn.find({ _id: { $in: tickedAddOns } }, { _id: 1 }).lean()).map((a) => a._id) : [],
    description: values.description,
    details,
    images,
    isActive: values.isActive === "on",
    isFeatured: values.isFeatured === "on",
    isNewArrival: values.isNewArrival === "on",
  };

  // Photos to drop from Cloudinary once saved: ones removed from this product,
  // plus ones uploaded during this edit and removed again before saving.
  const kept = new Set(images.map((img) => img.src));
  const dropped = uploadedThisEdit(formData).filter((src) => !kept.has(src));

  let savedId = id;
  try {
    if (id) {
      const doc = await Product.findById(id);
      if (!doc) return { error: "This product no longer exists.", values };
      dropped.push(...doc.images.map((img) => img.src).filter((src) => !kept.has(src)));
      doc.set(data);
      // Clearing the sale price must remove the field, not leave the old one.
      doc.set("compareAtPrice", compareAtPrice);
      await doc.save(); // save() runs every schema validator
    } else {
      const doc = await Product.create({ ...data, compareAtPrice, stock: 0 });
      savedId = doc._id.toString();
      if (stock) await setStock(savedId, stock, { actorId: session.user.id, note: "Initial stock" });
    }
  } catch (error) {
    if (isDuplicateKey(error)) return { fieldErrors: { slug: "Another product already uses this slug." }, values };
    throw error;
  }

  if (dropped.length) after(() => deleteUnusedImages(dropped));
  redirect(`/admin/products?notice=${encodeURIComponent(`Saved “${name}”.`)}`);
}

/** Show or hide a product in the store (soft delete). */
export async function setProductActiveAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 24);
  const active = formData.get("active") === "true";
  await connectDB();
  await Product.updateOne({ _id: id }, { $set: { isActive: active } });
  revalidatePath("/admin", "layout");
}
