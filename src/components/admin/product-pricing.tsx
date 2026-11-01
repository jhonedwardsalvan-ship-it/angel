"use client";

import { useState } from "react";
import { FormField } from "@/components/forms/form-field";

type Pricing = "fixed" | "per_piece";

type ProductPricingProps = {
  initial: { pricing: string; price: string; minPieces: string; madeToOrder: string };
  errors: { price?: string; minPieces?: string };
};

/** Pricing mode (fixed or per flower), minimum flowers and made to order. */
export function ProductPricing({ initial, errors }: ProductPricingProps) {
  const [pricing, setPricing] = useState<Pricing>(initial.pricing === "per_piece" ? "per_piece" : "fixed");
  const perPiece = pricing === "per_piece";

  return (
    <div className="stack gap-5">
      <input type="hidden" name="pricing" value={pricing} />

      <fieldset className="stack gap-2">
        <legend className="mb-1 text-sm">How is it priced?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["fixed", "Fixed price", "One price per item, e.g. a ready-made bouquet."],
            ["per_piece", "Price per flower", "Buyer picks how many flowers; you set the price of one."],
          ] as const).map(([value, title, hint]) => (
            <label key={value} className={`flex cursor-pointer gap-3 rounded-control border px-4 py-3 ${pricing === value ? "border-ink" : "border-line"}`}>
              <input type="radio" className="mt-1 accent-primary" checked={pricing === value} onChange={() => setPricing(value)} />
              <span className="stack gap-0.5">
                <span className="text-sm font-medium">{title}</span>
                <span className="text-xs text-ink-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label={perPiece ? "Price per flower (₱)" : "Price (₱)"} name="price" inputMode="numeric" required defaultValue={initial.price} error={errors.price} />
        {perPiece && (
          <FormField label="Minimum flowers" name="minPieces" inputMode="numeric" defaultValue={initial.minPieces || "5"} error={errors.minPieces} hint="Fewest flowers a buyer can choose." />
        )}
      </div>

      {perPiece ? (
        <p className="text-xs text-ink-muted">Per-flower bouquets are made to order, so there&apos;s no stock limit.</p>
      ) : (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="madeToOrder" defaultChecked={initial.madeToOrder === "on"} className="mt-1 size-4 accent-primary" />
          <span>
            Made to order <span className="block text-xs text-ink-muted">No stock limit: buyers can order any quantity.</span>
          </span>
        </label>
      )}
    </div>
  );
}
