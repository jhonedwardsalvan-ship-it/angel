"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addToCartAction } from "@/lib/cart/actions";
import { MAX_ADD_ON_QTY, MAX_PIECES, maxQuantity, priceFor, type LineConfig } from "@/lib/catalog/configure";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

/** − [number] + control. The number can also be typed; it's clamped on blur. */
function Stepper({ label, value, min, max, onChange, id }: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  id: string;
}) {
  // While typing, show the draft; otherwise always the current value (it can change from outside, e.g. a lower max).
  const [draft, setDraft] = useState<string | null>(null);
  const set = (n: number) => onChange(Math.max(min, Math.min(max, Number.isFinite(n) ? Math.round(n) : min)));
  return (
    <div className="flex h-12 w-fit items-center rounded-control border border-line-strong">
      <button type="button" className="grid h-full w-10 place-items-center text-lg disabled:text-ink-subtle" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => set(value - 1)}>
        −
      </button>
      <input
        id={id}
        aria-label={label}
        inputMode="numeric"
        className="h-full w-14 bg-transparent text-center tabular-nums outline-none"
        value={draft ?? String(value)}
        onFocus={() => setDraft(String(value))}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setDraft(digits);
          const n = Number(digits);
          if (digits !== "" && n >= min && n <= max) onChange(n);
        }}
        onBlur={() => {
          set(draft === null || draft === "" ? value : Number(draft));
          setDraft(null);
        }}
      />
      <button type="button" className="grid h-full w-10 place-items-center text-lg disabled:text-ink-subtle" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => set(value + 1)}>
        +
      </button>
    </div>
  );
}

export function AddToCart({ product }: { product: Product }) {
  const perPiece = product.pricing === "per_piece";
  const maxQty = maxQuantity(product);
  const [quantity, setQuantity] = useState(1);
  const [pieces, setPieces] = useState(product.minPieces);
  const [addOnQty, setAddOnQty] = useState<Record<string, number>>({});
  const [state, action, pending] = useActionState(addToCartAction, undefined);

  if (maxQty <= 0) {
    return (
      <button type="button" className="btn btn-primary btn-lg btn-block" disabled>
        Sold out
      </button>
    );
  }

  const config: LineConfig = {
    pieces: perPiece ? pieces : undefined,
    addOns: product.addOns.map((a) => ({ id: a.id, qty: addOnQty[a.id] ?? 0 })).filter((a) => a.qty > 0),
  };
  const { unitPrice, breakdown } = priceFor(product, config);

  return (
    <form action={action} className="stack gap-5">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="quantity" value={quantity} />
      {perPiece && <input type="hidden" name="pieces" value={pieces} />}
      {config.addOns.map((a) => <input key={a.id} type="hidden" name={`addon_${a.id}`} value={a.qty} />)}

      {perPiece && (
        <div className="stack gap-2">
          <label htmlFor="cfg-pieces" className="text-sm font-medium">Number of flowers</label>
          <Stepper id="cfg-pieces" label="number of flowers" value={pieces} min={product.minPieces} max={MAX_PIECES} onChange={setPieces} />
          <p className="text-xs text-ink-muted">{formatPrice(product.price)} per flower · minimum {product.minPieces}</p>
        </div>
      )}

      {product.addOns.length > 0 && (
        <fieldset className="stack gap-3">
          <legend className="mb-1 text-sm font-medium">Add-ons</legend>
          {product.addOns.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line px-4 py-3">
              <label htmlFor={`cfg-${a.id}`} className="text-sm">
                {a.name} <span className="text-ink-muted">+{formatPrice(a.price)} each</span>
                <span className="block text-xs text-ink-muted">How many?</span>
              </label>
              <Stepper
                id={`cfg-${a.id}`}
                label={`number of ${a.name}`}
                value={addOnQty[a.id] ?? 0}
                min={0}
                max={MAX_ADD_ON_QTY}
                onChange={(n) => setAddOnQty((q) => ({ ...q, [a.id]: n }))}
              />
            </div>
          ))}
        </fieldset>
      )}

      {(perPiece || config.addOns.length > 0) && (
        <dl className="stack gap-1 rounded-control bg-surface p-4 text-sm">
          {breakdown.map((l) => (
            <div key={l.label} className="flex justify-between gap-4">
              <dt className="text-ink-muted">{l.label === "Item" ? product.name : l.label}</dt>
              <dd className="tabular-nums">{formatPrice(l.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-line pt-2 font-medium">
            <dt>Per {perPiece ? "bouquet" : "item"}</dt>
            <dd className="tabular-nums">{formatPrice(unitPrice)}</dd>
          </div>
        </dl>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="stack gap-1">
          <Stepper id="cfg-qty" label="quantity" value={quantity} min={1} max={maxQty} onChange={setQuantity} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg min-w-48 flex-1 px-4" disabled={pending}>
          {pending ? "Adding…" : `Add to cart · ${formatPrice(unitPrice * quantity)}`}
        </button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm">
        {state && (
          <span className={state.status === "error" ? "text-danger" : "text-success"}>
            {state.message}{" "}
            {state.status === "added" && (
              <Link href="/cart" className="link text-ink">
                View cart
              </Link>
            )}
          </span>
        )}
      </p>
    </form>
  );
}
