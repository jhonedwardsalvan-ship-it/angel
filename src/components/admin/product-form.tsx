"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SelectField } from "@/components/forms/select-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { saveProductAction } from "@/lib/admin/actions/products";
import type { AdminProduct } from "@/types/admin";

type ProductFormProps = {
  product?: AdminProduct;
  categories: { value: string; label: string }[];
};

export function ProductForm({ product, categories }: ProductFormProps) {
  const [state, action, pending] = useActionState(saveProductAction, undefined);
  const initial: Record<string, string> = product
    ? {
        name: product.name,
        slug: product.slug,
        category: product.category?.id ?? "",
        price: String(product.price),
        compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
        description: product.description,
        details: product.details.join("\n"),
        images: product.images.map((i) => `${i.src} | ${i.alt}`).join("\n"),
        isActive: product.isActive ? "on" : "",
        isFeatured: product.isFeatured ? "on" : "",
        isNewArrival: product.isNewArrival ? "on" : "",
      }
    : { isActive: "on", stock: "0" };
  const v = (k: string) => state?.values?.[k] ?? initial[k] ?? "";
  const e = (k: string) => state?.fieldErrors?.[k];

  return (
    <form action={action} noValidate className="stack gap-8">
      {product && <input type="hidden" name="id" value={product.id} />}
      <FormAlert message={state?.error} />

      <div className="panel stack gap-5">
        <h2 className="text-h4">Details</h2>
        <FormField label="Name" name="name" required defaultValue={v("name")} error={e("name")} />
        <FormField label="Slug" name="slug" defaultValue={v("slug")} error={e("slug")} hint="Used in the URL. Leave empty to generate it from the name. Changing it breaks old links." />
        <SelectField label="Category" name="category" options={categories} placeholder="Choose a category" defaultValue={v("category")} error={e("category")} />
        <TextareaField label="Description" name="description" rows={4} defaultValue={v("description")} error={e("description")} />
        <TextareaField label="Details" name="details" rows={4} defaultValue={v("details")} error={e("details")} hint="One per line, e.g. “12 stems” or “Glass vase included”." />
      </div>

      <div className="panel stack gap-5">
        <h2 className="text-h4">Pricing{product ? "" : " & stock"}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Price (₱)" name="price" inputMode="numeric" required defaultValue={v("price")} error={e("price")} />
          <FormField label="Compare-at price (₱)" name="compareAtPrice" inputMode="numeric" defaultValue={v("compareAtPrice")} error={e("compareAtPrice")} hint="Optional. Higher than the price to show a sale." />
        </div>
        {product ? (
          <p className="text-sm text-ink-muted">
            Stock: <strong className="font-medium text-ink">{product.stock}</strong>.{" "}
            <Link href={`/admin/inventory?q=${encodeURIComponent(product.name)}`} className="link">Update it in Inventory</Link>{" "}
            so the change is logged.
          </p>
        ) : (
          <FormField label="Starting stock" name="stock" inputMode="numeric" defaultValue={v("stock")} error={e("stock")} />
        )}
      </div>

      <div className="panel stack gap-5">
        <h2 className="text-h4">Images</h2>
        <TextareaField
          label="Image URLs"
          name="images"
          rows={4}
          defaultValue={v("images")}
          error={e("images")}
          hint="One per line as “URL | alt text”. The first image is shown on cards. Only images.unsplash.com is allowed for now."
          className="input resize-y font-mono text-xs"
        />
        {product && product.images.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Current images">
            {product.images.map((img) => (
              <li key={img.src} className="media size-20">
                {/* eslint-disable-next-line @next/next/no-img-element -- small admin preview */}
                <img src={img.src} alt={img.alt} className="absolute inset-0 size-full object-cover" />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel stack gap-4">
        <h2 className="text-h4">Visibility</h2>
        <CheckboxField label="Live in the store" name="isActive" defaultChecked={v("isActive") === "on"} hint="Unchecked products are hidden everywhere but kept for order history." />
        <CheckboxField label="Featured" name="isFeatured" defaultChecked={v("isFeatured") === "on"} hint="Shown in Best sellers on the homepage." />
        <CheckboxField label="New arrival" name="isNewArrival" defaultChecked={v("isNewArrival") === "on"} hint="Listed on the New arrivals page." />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <Link href="/admin/products" className="btn btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
