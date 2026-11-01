"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SelectField } from "@/components/forms/select-field";
import { saveSettingsAction } from "@/lib/admin/actions/settings";
import { MAX_HIGHLIGHTS } from "@/lib/admin/form";
import type { StoreSettings } from "@/lib/settings";

const ICON_OPTIONS = [
  { value: "truck", label: "Delivery truck" },
  { value: "card", label: "Card / envelope" },
  { value: "leaf", label: "Leaf" },
  { value: "shield", label: "Shield" },
];

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, undefined);
  const initial: Record<string, string> = {
    deliveryFee: String(settings.deliveryFee),
    freeDeliveryMin: String(settings.freeDeliveryMin),
    leadDays: String(settings.leadDays),
  };
  for (let i = 0; i < MAX_HIGHLIGHTS; i++) {
    const h = settings.productHighlights[i];
    initial[`h${i}Icon`] = h?.icon ?? "truck";
    initial[`h${i}Title`] = h?.title ?? "";
    initial[`h${i}Body`] = h?.body ?? "";
  }
  const v = (k: string) => state?.values?.[k] ?? initial[k] ?? "";
  const e = (k: string) => state?.fieldErrors?.[k];

  return (
    <form action={action} noValidate className="stack gap-8">
      <FormAlert message={state?.error} />

      <section className="panel stack gap-5" aria-labelledby="delivery-title">
        <h2 id="delivery-title" className="text-h4">Delivery</h2>
        <FormField label="Book at least (days ahead)" name="leadDays" inputMode="numeric" defaultValue={v("leadDays")} error={e("leadDays")} hint="Earliest delivery date buyers can pick at checkout. 3 means today + 3 days." />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Delivery fee (₱)" name="deliveryFee" inputMode="numeric" defaultValue={v("deliveryFee")} error={e("deliveryFee")} hint="Charged at checkout. 0 makes delivery always free." />
          <FormField label="Free delivery from (₱)" name="freeDeliveryMin" inputMode="numeric" defaultValue={v("freeDeliveryMin")} error={e("freeDeliveryMin")} hint="Orders at or above this subtotal deliver free. 0 turns this off." />
        </div>
      </section>

      <section className="panel stack gap-5" aria-labelledby="highlights-title">
        <div className="stack gap-1">
          <h2 id="highlights-title" className="text-h4">Product page highlights</h2>
          <p className="text-sm text-ink-muted">
            Shown under “Add to cart” on every product. The title is bold, the text follows it. Write{" "}
            <code>{"{freeDeliveryMin}"}</code>, <code>{"{deliveryFee}"}</code> or <code>{"{leadDays}"}</code> to show the current values. Leave a
            row empty to hide it.
          </p>
        </div>
        {Array.from({ length: MAX_HIGHLIGHTS }, (_, i) => (
          <fieldset key={i} className="grid gap-4 border-t border-line pt-5 first-of-type:border-t-0 first-of-type:pt-0 sm:grid-cols-[10rem_1fr]">
            <legend className="sr-only">Highlight {i + 1}</legend>
            <SelectField label="Icon" name={`h${i}Icon`} options={ICON_OPTIONS} defaultValue={v(`h${i}Icon`)} error={e(`h${i}Icon`)} />
            <FormField label={`Title ${i + 1}`} name={`h${i}Title`} maxLength={60} defaultValue={v(`h${i}Title`)} error={e(`h${i}Title`)} placeholder="e.g. Book ahead" />
            <div className="sm:col-start-2">
              <FormField label="Text" name={`h${i}Body`} maxLength={200} defaultValue={v(`h${i}Body`)} error={e(`h${i}Body`)} placeholder="e.g. — order at least {leadDays} days before your date." />
            </div>
          </fieldset>
        ))}
      </section>

      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
