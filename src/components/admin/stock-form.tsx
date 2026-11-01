"use client";

import { useActionState } from "react";
import { updateStockAction } from "@/lib/admin/actions/inventory";

/** Inline per-product stock editor: adjust by ±n, or set an exact count. */
export function StockForm({ productId, productName }: { productId: string; productName: string }) {
  const [state, action, pending] = useActionState(updateStockAction, undefined);
  const error = state?.fieldErrors?.amount ?? state?.error;
  const id = `stock-${productId}`;

  return (
    <form action={action} className="stack gap-1">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${id}-mode`} className="sr-only">Change type for {productName}</label>
        <select id={`${id}-mode`} name="mode" defaultValue={state?.values?.mode ?? "adjust"} className="input min-h-9 w-auto py-1 pr-7 text-sm">
          <option value="adjust">Add / remove</option>
          <option value="set">Set to</option>
        </select>
        <label htmlFor={`${id}-amount`} className="sr-only">Amount for {productName}</label>
        <input
          id={`${id}-amount`}
          name="amount"
          inputMode="numeric"
          placeholder="e.g. 5 or -2"
          defaultValue={state?.notice ? "" : state?.values?.amount}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-msg`}
          className="input min-h-9 w-28 py-1 text-sm"
        />
        <label htmlFor={`${id}-note`} className="sr-only">Note for {productName}</label>
        <input
          id={`${id}-note`}
          name="note"
          placeholder="Note (optional)"
          maxLength={200}
          defaultValue={state?.notice ? "" : state?.values?.note}
          className="input min-h-9 w-40 py-1 text-sm"
        />
        <button type="submit" className="btn btn-outline btn-sm min-h-9" disabled={pending}>
          {pending ? "Saving…" : "Update"}
        </button>
      </div>
      <p id={`${id}-msg`} aria-live="polite" className="min-h-4 text-xs">
        {error ? <span className="text-danger">{error}</span> : state?.notice && <span className="text-success">{state.notice}</span>}
      </p>
    </form>
  );
}
