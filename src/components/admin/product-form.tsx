"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ProductImages } from "@/components/admin/product-images";
import { ProductPricing } from "@/components/admin/product-pricing";
import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SelectField } from "@/components/forms/select-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { saveProductAction } from "@/lib/admin/actions/products";
import { formatPrice } from "@/lib/format";
import type { AdminAddOn, AdminColor, AdminProduct } from "@/types/admin";

type ProductFormProps = {
  product?: AdminProduct;
  categories: { value: string; label: string }[];
  addOns: AdminAddOn[];
  colors: AdminColor[];
};

export function ProductForm({ product, categories, addOns, colors }: ProductFormProps) {
  const [state, action, pending] = useActionState(saveProductAction, undefined);
  const initial: Record<string, string> = product
    ? {
        name: product.name,
        slug: product.slug,
        category: product.category?.id ?? "",
        pricing: product.pricing,
        price: String(product.price),
        minPieces: String(product.minPieces),
        madeToOrder: product.madeToOrder ? "on" : "",
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
  // After a failed save, keep what was ticked; otherwise the product's saved add-ons.
  const selectedColors = new Set(state?.values?.colorIds !== undefined ? state.values.colorIds.split(",") : (product?.colorIds ?? []));
  const selectedAddOns = new Set(state?.values?.addOnIds !== undefined ? state.values.addOnIds.split(",") : (product?.addOnIds ?? []));
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
        <ProductPricing
          initial={{ pricing: v("pricing"), price: v("price"), minPieces: v("minPieces"), madeToOrder: v("madeToOrder") }}
          errors={{ price: e("price"), minPieces: e("minPieces") }}
        />
        <FormField label="Compare-at price (₱)" name="compareAtPrice" inputMode="numeric" defaultValue={v("compareAtPrice")} error={e("compareAtPrice")} hint="Optional. Higher than the price to show a sale (fixed-price products)." />
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

      <div className="panel stack gap-4">
        <div className="stack gap-1">
          <h2 className="text-h4">Add-ons</h2>
          <p className="text-sm text-ink-muted">
            Tick the extras buyers can add to this product. <Link href="/admin/add-ons" className="link">Manage add-ons</Link>
          </p>
        </div>
        {addOns.filter((a) => a.isActive).length === 0 ? (
          <p className="text-sm text-ink-muted">No add-ons yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {addOns.filter((a) => a.isActive).map((a) => (
              <li key={a.id}>
                {a.appliesTo === "all" ? (
                  <span className="flex items-center gap-3 rounded-control border border-line px-3 py-2 text-sm text-ink-muted">
                    <input type="checkbox" checked disabled className="size-4" aria-label={`${a.name} (all products)`} />
                    {a.name} · {formatPrice(a.price)} each <span className="ml-auto text-xs">All products</span>
                  </span>
                ) : (
                  <label className="flex cursor-pointer items-center gap-3 rounded-control border border-line px-3 py-2 text-sm">
                    <input type="checkbox" name="addOnIds" value={a.id} defaultChecked={selectedAddOns.has(a.id)} className="size-4 accent-primary" />
                    {a.name} · {formatPrice(a.price)} each
                  </label>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel stack gap-5">
        <div className="stack gap-1">
          <h2 className="text-h4">Colors</h2>
          <p className="text-sm text-ink-muted">
            Tick the colors buyers can choose for this product. Each is offered for flowers, wrapper or both, as set in Colors; buyers pick 1 or 2 of each. Tick none to skip colors.{" "}
            <Link href="/admin/colors" className="link">Manage colors</Link>
          </p>
        </div>
        {colors.filter((c) => c.isActive).length === 0 ? (
          <p className="text-sm text-ink-muted">No colors yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {colors.filter((c) => c.isActive).map((c) => (
              <li key={c.id}>
                <label className={`flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-sm ${c.appliesTo === "all" ? "text-ink-muted" : "cursor-pointer"}`}>
                  {c.appliesTo === "all" ? (
                    <input type="checkbox" checked disabled className="size-4" aria-label={`${c.name} (all products)`} />
                  ) : (
                    <input type="checkbox" name="colorIds" value={c.id} defaultChecked={selectedColors.has(c.id)} className="size-4 accent-primary" />
                  )}
                  <span className="size-4 rounded-pill border border-line" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                  {c.name}
                  <span className="text-xs text-ink-muted">
                    · {[c.forFlowers && "flowers", c.forWrappers && "wrapper"].filter(Boolean).join(" & ")}
                    {c.appliesTo === "all" && ", all products"}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel stack gap-5">
        <h2 className="text-h4">Images</h2>
        <ProductImages initial={v("images")} error={e("images")} productNameFieldId="field-name" />
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
