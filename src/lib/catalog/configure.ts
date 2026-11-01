// Product options and pricing: per-flower bouquets and add-ons. Pure, so the
// product page (live total), the cart and checkout all use the same math. The
// server always recalculates from the product's current prices.

/** A shared extra from Admin → Add-ons, priced per piece; the buyer picks how many. */
export type AddOn = { id: string; name: string; price: number };
/** A shared color from Admin → Colors. */
export type ColorOption = { id: string; name: string; hex: string };
export type ColorKind = "flower" | "wrapper";

export type PricedProduct = {
  pricing: "fixed" | "per_piece";
  /** Whole pesos: per item (fixed) or per flower (per_piece). */
  price: number;
  /** Fewest flowers in a per-piece bouquet. */
  minPieces: number;
  madeToOrder: boolean;
  stock: number;
  addOns: AddOn[];
  flowerColors: ColorOption[];
  wrapperColors: ColorOption[];
};

/** What the buyer chose for one cart line: flowers (per-flower products) and how many of each add-on. */
export type LineConfig = {
  pieces?: number;
  addOns: { id: string; qty: number }[];
  /** Color ids, 1–2 of each kind when the product offers that kind. */
  flowerColors: string[];
  wrapperColors: string[];
};

export const MAX_QUANTITY = 999;
export const MAX_PIECES = 999;
export const MAX_ADD_ON_QTY = 999;
export const MAX_COLORS = 2;

const COLOR_WORD: Record<ColorKind, string> = { flower: "flower", wrapper: "wrapper" };

/** Keeps known, distinct color ids; requires 1–MAX_COLORS when the product offers that kind. */
function pickColors(offered: ColorOption[], chosen: string[], kind: ColorKind): string[] | { error: string } {
  if (offered.length === 0) return [];
  const ids = [...new Set(chosen)].filter((id) => offered.some((c) => c.id === id));
  if (ids.length === 0) return { error: `Choose 1 or ${MAX_COLORS} ${COLOR_WORD[kind]} colors.` };
  if (ids.length > MAX_COLORS) return { error: `Choose up to ${MAX_COLORS} ${COLOR_WORD[kind]} colors.` };
  return ids;
}

/** Made-to-order and per-flower products have no stock limit. */
export function hasStockLimit(p: Pick<PricedProduct, "pricing" | "madeToOrder">) {
  return p.pricing !== "per_piece" && !p.madeToOrder;
}

/** Most a buyer can put in one line (and cart total for that product). */
export function maxQuantity(p: Pick<PricedProduct, "pricing" | "madeToOrder" | "stock">) {
  return hasStockLimit(p) ? Math.min(p.stock, MAX_QUANTITY) : MAX_QUANTITY;
}

/** Lowest possible price, for cards: "From ₱250" on per-flower bouquets. */
export function startingPrice(p: Pick<PricedProduct, "pricing" | "price" | "minPieces">) {
  return p.pricing === "per_piece" ? p.price * p.minPieces : p.price;
}

/**
 * Validates a buyer's choice against the product. Unknown add-ons are dropped,
 * flower counts are clamped. Returns an error for choices that can't be fixed.
 */
export function normalizeConfig(p: PricedProduct, raw: LineConfig): LineConfig | { error: string } {
  let pieces: number | undefined;
  if (p.pricing === "per_piece") {
    pieces = raw.pieces ?? NaN;
    if (!Number.isInteger(pieces) || pieces < p.minPieces) return { error: `Choose at least ${p.minPieces} flowers.` };
    if (pieces > MAX_PIECES) return { error: `Choose up to ${MAX_PIECES} flowers.` };
  }
  const addOns: LineConfig["addOns"] = [];
  for (const choice of raw.addOns) {
    if (!p.addOns.some((a) => a.id === choice.id) || !Number.isInteger(choice.qty) || choice.qty <= 0) continue;
    addOns.push({ id: choice.id, qty: Math.min(choice.qty, MAX_ADD_ON_QTY) });
  }
  const flowerColors = pickColors(p.flowerColors, raw.flowerColors, "flower");
  if ("error" in flowerColors) return flowerColors;
  const wrapperColors = pickColors(p.wrapperColors, raw.wrapperColors, "wrapper");
  if ("error" in wrapperColors) return wrapperColors;
  return { pieces, addOns, flowerColors, wrapperColors };
}

/** Color choices as ₱0 lines, e.g. "Flowers: Red & Pink", so carts and orders list them with the priced options. */
export function colorLines(p: PricedProduct, config: LineConfig): PriceLine[] {
  const names = (offered: ColorOption[], ids: string[]) =>
    ids.map((id) => offered.find((c) => c.id === id)?.name).filter(Boolean).join(" & ");
  const lines: PriceLine[] = [];
  const flowers = names(p.flowerColors, config.flowerColors);
  const wrapper = names(p.wrapperColors, config.wrapperColors);
  if (flowers) lines.push({ label: `Flowers: ${flowers}`, amount: 0 });
  if (wrapper) lines.push({ label: `Wrapper: ${wrapper}`, amount: 0 });
  return lines;
}

export type PriceLine = { label: string; amount: number };

/** Price of one item with its options, plus a readable breakdown. */
export function priceFor(p: PricedProduct, config: LineConfig): { unitPrice: number; breakdown: PriceLine[] } {
  const breakdown: PriceLine[] = [];
  if (p.pricing === "per_piece" && config.pieces) {
    breakdown.push({ label: `${config.pieces} ${config.pieces === 1 ? "flower" : "flowers"}`, amount: config.pieces * p.price });
  } else {
    breakdown.push({ label: "Item", amount: p.price });
  }
  for (const choice of config.addOns) {
    const addOn = p.addOns.find((a) => a.id === choice.id);
    if (!addOn) continue;
    breakdown.push({ label: `${addOn.name} × ${choice.qty}`, amount: choice.qty * addOn.price });
  }
  return { unitPrice: breakdown.reduce((sum, l) => sum + l.amount, 0), breakdown };
}

/** Lines with the same product and options merge in the cart. */
export function lineKey(productId: string, config: LineConfig) {
  const addOns = [...config.addOns].sort((a, b) => a.id.localeCompare(b.id)).map((a) => `${a.id}:${a.qty}`).join(",");
  const colors = [...config.flowerColors].sort().join("+") + "/" + [...config.wrapperColors].sort().join("+");
  return `${productId}|${config.pieces ?? ""}|${addOns}|${colors}`;
}

/** Short option labels for carts and orders, e.g. ["20 flowers", "Glitter on 10 flowers", "Gift card"]. */
export function describeOptions(breakdown: PriceLine[]) {
  return breakdown.filter((l) => l.label !== "Item").map((l) => l.label);
}
