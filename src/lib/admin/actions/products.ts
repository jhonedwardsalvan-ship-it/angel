"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { setStock } from "@/lib/inventory";
import { requireAdmin } from "@/lib/session";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { Category } from "@/models/category";
import { Product } from "@/models/product";
import type { AdminFormState } from "@/types/admin";
import { checked, isAllowedImageUrl, isDuplicateKey, parseImageLines, text, wholeNumber } from "../form";

export async function saveProductAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const session = await requireAdmin();
  const id = text(formData, "id", 24);
  const values = Object.fromEntries(
    ["name", "slug", "category", "price", "compareAtPrice", "stock", "description", "details", "images"].map((k) => [k, text(formData, k, 4000)]),
  );
  for (const k of ["isActive", "isFeatured", "isNewArrival"]) values[k] = checked(formData, k) ? "on" : "";

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
  if (images.length === 0) fieldErrors.images = "Add at least one image.";
  else if (images.some((img) => !isAllowedImageUrl(img.src) || !img.alt)) {
    fieldErrors.images = "Each line needs an https://images.unsplash.com/… URL, then | and alt text.";
  }

  await connectDB();
  const category = /^[a-f0-9]{24}$/i.test(values.category) ? await Category.exists({ _id: values.category }) : null;
  if (!category) fieldErrors.category = "Choose a category.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const data = {
    name,
    slug,
    category: values.category,
    price,
    description: values.description,
    details,
    images,
    isActive: values.isActive === "on",
    isFeatured: values.isFeatured === "on",
    isNewArrival: values.isNewArrival === "on",
  };

  let savedId = id;
  try {
    if (id) {
      const doc = await Product.findById(id);
      if (!doc) return { error: "This product no longer exists.", values };
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
