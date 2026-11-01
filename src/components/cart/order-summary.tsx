import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";

type OrderSummaryProps = {
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** Shows an "add ₱X more for free delivery" hint when set above 0. */
  freeDeliveryMin?: number;
  /** Content above the totals, e.g. a compact item list at checkout. */
  children?: ReactNode;
  /** Call to action under the totals. */
  footer?: ReactNode;
};

/** Totals panel shared by the cart, checkout and confirmation pages. */
export function OrderSummary({ subtotal, deliveryFee, total, freeDeliveryMin = 0, children, footer }: OrderSummaryProps) {
  const toFreeDelivery = freeDeliveryMin > 0 ? freeDeliveryMin - subtotal : 0;

  return (
    <section aria-labelledby="summary-title" className="stack gap-5 rounded-card bg-surface p-5 md:p-6">
      <h2 id="summary-title" className="text-h4">
        Order summary
      </h2>
      {children}
      <dl className="stack gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Delivery</dt>
          <dd className="tabular-nums">{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</dd>
        </div>
        {deliveryFee > 0 && toFreeDelivery > 0 && (
          <p className="text-xs text-ink-muted">
            Add {formatPrice(toFreeDelivery)} more for free delivery.
          </p>
        )}
        <div className="flex justify-between gap-4 border-t border-line pt-3 text-base">
          <dt>Total</dt>
          <dd className="font-medium tabular-nums">{formatPrice(total)}</dd>
        </div>
      </dl>
      {footer}
    </section>
  );
}
