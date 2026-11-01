"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addToCartAction } from "@/lib/cart/actions";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart/pricing";
import { formatPrice } from "@/lib/format";

type AddToCartProps = {
  productId: string;
  price: number;
  stock: number;
};

export function AddToCart({ productId, price, stock }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [state, action, pending] = useActionState(addToCartAction, undefined);
  const soldOut = stock <= 0;
  const max = Math.min(stock, MAX_QUANTITY_PER_LINE);

  if (soldOut) {
    return (
      <div className="stack gap-3">
        <button type="button" className="btn btn-primary btn-lg btn-block" disabled>
          Sold out
        </button>
        <button type="button" className="btn btn-outline btn-lg btn-block">
          Notify me when available
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="stack gap-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={quantity} />
      <div className="flex gap-3">
        <div className="flex h-14 items-center rounded-control border border-line-strong">
          <button
            type="button"
            className="grid h-full w-11 place-items-center text-lg disabled:text-ink-subtle"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <output aria-live="polite" aria-label="Quantity" className="w-8 text-center tabular-nums">
            {quantity}
          </output>
          <button
            type="button"
            className="grid h-full w-11 place-items-center text-lg disabled:text-ink-subtle"
            aria-label="Increase quantity"
            disabled={quantity >= max}
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
          >
            +
          </button>
        </div>
        <button type="submit" className="btn btn-primary btn-lg flex-1 px-4" disabled={pending}>
          {pending ? "Adding…" : `Add to cart · ${formatPrice(price * quantity)}`}
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
