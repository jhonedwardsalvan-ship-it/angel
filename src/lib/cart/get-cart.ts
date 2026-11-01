import "server-only";
import { cache } from "react";
import { getProductsByIds } from "@/lib/catalog/queries";
import { getStoreSettings } from "@/lib/settings";
import type { Product } from "@/types/catalog";
import { colorLines, describeOptions, hasStockLimit, lineKey, normalizeConfig, priceFor, type LineConfig, type PriceLine } from "@/lib/catalog/configure";
import { readCart } from "./cart-cookie";
import { deliveryFeeFor } from "./pricing";

export type CartIssue = "sold-out" | "insufficient-stock";

export type CartLine = {
  /** Identifies the line for quantity changes (product + options). */
  key: string;
  product: Product;
  quantity: number;
  config: LineConfig;
  /** One item with its options, at current prices. */
  unitPrice: number;
  breakdown: PriceLine[];
  /** e.g. ["20 flowers", "Glitter on 10 flowers"]; empty for plain items. */
  options: string[];
  lineTotal: number;
  /** Set when the line can't be ordered as-is. */
  issue?: CartIssue;
};

export type Cart = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  /** Current free-delivery minimum; 0 when free delivery is off. */
  freeDeliveryMin: number;
  total: number;
  /** True when any line needs attention before checkout. */
  hasIssues: boolean;
};

/**
 * The cart with live prices and stock. Products that were removed or
 * deactivated drop out silently. Cached per request.
 */
export const getCart = cache(async (): Promise<Cart> => {
  const [entries, settings] = await Promise.all([readCart(), getStoreSettings()]);
  const products = entries.length
    ? await getProductsByIds(entries.map((e) => e.productId))
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  // Stock is per product: lines of the same product with different options share it.
  const wantedByProduct = new Map<string, number>();
  for (const e of entries) wantedByProduct.set(e.productId, (wantedByProduct.get(e.productId) ?? 0) + e.quantity);

  const lines: CartLine[] = entries.flatMap(({ productId, quantity, ...raw }) => {
    const product = byId.get(productId);
    if (!product) return [];
    // Options are re-checked against the product's current settings; invalid lines drop out.
    const config = normalizeConfig(product, raw);
    if ("error" in config) return [];
    const priced = priceFor(product, config);
    const unitPrice = priced.unitPrice;
    // Colors don't change the price; they ride along as ₱0 lines so carts and orders list them.
    const breakdown = [...priced.breakdown, ...colorLines(product, config)];
    const wanted = wantedByProduct.get(productId) ?? quantity;
    const issue: CartIssue | undefined = !hasStockLimit(product)
      ? undefined
      : product.stock <= 0
        ? "sold-out"
        : wanted > product.stock
          ? "insufficient-stock"
          : undefined;
    return [{
      key: lineKey(productId, config),
      product,
      quantity,
      config,
      unitPrice,
      breakdown,
      options: describeOptions(breakdown),
      lineTotal: unitPrice * quantity,
      issue,
    }];
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const deliveryFee = deliveryFeeFor(subtotal, settings);
  return {
    lines,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotal,
    deliveryFee,
    freeDeliveryMin: settings.freeDeliveryMin,
    total: subtotal + deliveryFee,
    hasIssues: lines.some((l) => l.issue),
  };
});
