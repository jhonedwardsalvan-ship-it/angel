"use server";

import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/session";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { Category } from "@/models/category";
import { Product } from "@/models/product";
import type { AdminFormState } from "@/types/admin";
import { checked, isAllowedImageUrl, isDuplicateKey, text, wholeNumber } from "../form";

export async function saveCategoryAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = text(formData, "id", 24);
  const values = Object.fromEntries(
    ["name", "slug", "description", "imageSrc", "imageAlt", "sortOrder"].map((k) => [k, text(formData, k, 1000)]),
  );
  values.isActive = checked(formData, "isActive") ? "on" : "";

  const fieldErrors: Record<string, string> = {};
  const name = values.name.slice(0, 80);
  const slug = slugify(values.slug || name);
  const sortOrder = values.sortOrder ? wholeNumber(formData, "sortOrder") : 0;
  if (!name) fieldErrors.name = "Enter a category name.";
  if (!SLUG_PATTERN.test(slug)) fieldErrors.slug = "Use lowercase letters, numbers and hyphens.";
  if (slug === "new") fieldErrors.slug = "“new” is reserved for the New arrivals page.";
  if (!Number.isFinite(sortOrder)) fieldErrors.sortOrder = "Enter a whole number.";
  if (!isAllowedImageUrl(values.imageSrc)) fieldErrors.imageSrc = "Use an https://images.unsplash.com/… URL.";
  if (!values.imageAlt) fieldErrors.imageAlt = "Describe the image.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const data = {
    name,
    slug,
    description: values.description.slice(0, 300),
    image: { src: values.imageSrc, alt: values.imageAlt },
    sortOrder,
    isActive: values.isActive === "on",
  };

  await connectDB();
  try {
    if (id) {
      const doc = await Category.findById(id);
      if (!doc) return { error: "This category no longer exists.", values };
      doc.set(data);
      await doc.save();
    } else {
      await Category.create(data);
    }
  } catch (error) {
    if (isDuplicateKey(error)) return { fieldErrors: { slug: "Another category already uses this slug." }, values };
    throw error;
  }

  redirect(`/admin/categories?notice=${encodeURIComponent(`Saved “${name}”.`)}`);
}

/** Deletes a category only when no products (including hidden ones) use it. */
export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 24);
  await connectDB();
  const inUse = await Product.countDocuments({ category: id });
  if (inUse > 0) {
    redirect(`/admin/categories?error=${encodeURIComponent(`Move or delete its ${inUse} product(s) first.`)}`);
  }
  const deleted = await Category.findByIdAndDelete(id);
  redirect(`/admin/categories?notice=${encodeURIComponent(deleted ? `Deleted “${deleted.name}”.` : "Category already deleted.")}`);
}
