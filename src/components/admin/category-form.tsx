"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CategoryImage } from "@/components/admin/category-image";
import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { saveCategoryAction } from "@/lib/admin/actions/categories";
import type { AdminCategory } from "@/types/admin";

export function CategoryForm({ category }: { category?: AdminCategory }) {
  const [state, action, pending] = useActionState(saveCategoryAction, undefined);
  const initial: Record<string, string> = category
    ? {
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageSrc: category.image.src,
        imageAlt: category.image.alt,
        sortOrder: String(category.sortOrder),
        isActive: category.isActive ? "on" : "",
      }
    : { isActive: "on", sortOrder: "0" };
  const v = (k: string) => state?.values?.[k] ?? initial[k] ?? "";
  const e = (k: string) => state?.fieldErrors?.[k];

  return (
    <form action={action} noValidate className="stack gap-8">
      {category && <input type="hidden" name="id" value={category.id} />}
      <FormAlert message={state?.error} />

      <div className="panel stack gap-5">
        <FormField label="Name" name="name" required defaultValue={v("name")} error={e("name")} />
        <FormField label="Slug" name="slug" defaultValue={v("slug")} error={e("slug")} hint="Used in /collections/<slug>. Leave empty to generate it from the name." />
        <TextareaField label="Description" name="description" rows={2} maxLength={300} defaultValue={v("description")} error={e("description")} hint="One short line shown under the name." />
        <FormField label="Sort order" name="sortOrder" inputMode="numeric" defaultValue={v("sortOrder")} error={e("sortOrder")} hint="Lower shows first." className="input max-w-32" />
        <CategoryImage initial={v("imageSrc")} error={e("imageSrc")} altFieldId="field-imageAlt" />
        <FormField label="Photo description" name="imageAlt" defaultValue={v("imageAlt")} error={e("imageAlt")} hint="A few words describing the photo, for screen readers." />
        <CheckboxField label="Live in the store" name="isActive" defaultChecked={v("isActive") === "on"} hint="Hiding a category also hides all of its products from the store." />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : category ? "Save changes" : "Create category"}
        </button>
        <Link href="/admin/categories" className="btn btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
