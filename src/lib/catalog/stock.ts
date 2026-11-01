import type { Product, StockState } from "@/types/catalog";

export const LOW_STOCK_THRESHOLD = 5;

export function getStockState(product: Pick<Product, "stock">): StockState {
  if (product.stock <= 0) return "sold-out";
  if (product.stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}
