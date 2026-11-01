import "server-only";
import { cache } from "react";
import { getProductsByIds } from "@/lib/catalog/queries";
import type { Product } from "@/types/catalog";
import { readCart } from "./cart-cookie";
import { deliveryFeeFor } from "./pricing";

export type CartIssue = "sold-out" | "insufficient-stock";

export type CartLine = {
  product: Product;
  quantity: number;
  lineTotal: number;
  /** Set when the line can't be ordered as-is. */
  issue?: CartIssue;
};

export type Cart = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** True when any line needs attention before checkout. */
  hasIssues: boolean;
};

/**
 * The cart with live prices and stock. Products that were removed or
 * deactivated drop out silently. Cached per request.
 */
export const getCart = cache(async (): Promise<Cart> => {
  const entries = await readCart();
  const products = entries.length
    ? await getProductsByIds(entries.map((e) => e.productId))
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: CartLine[] = entries.flatMap(({ productId, quantity }) => {
    const product = byId.get(productId);
    if (!product) return [];
    const issue: CartIssue | undefined =
      product.stock <= 0 ? "sold-out" : quantity > product.stock ? "insufficient-stock" : undefined;
    return [{ product, quantity, lineTotal: product.price * quantity, issue }];
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const deliveryFee = deliveryFeeFor(subtotal);
  return {
    lines,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    hasIssues: lines.some((l) => l.issue),
  };
});
