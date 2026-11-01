import { getStockState } from "@/lib/catalog/stock";
import type { Product } from "@/types/catalog";

export function StockStatus({ product }: { product: Product }) {
  switch (getStockState(product)) {
    case "sold-out":
      return <p className="stock stock-out">Sold out — back soon</p>;
    case "low-stock":
      return <p className="stock stock-low">Only {product.stock} left in stock</p>;
    default:
      return <p className="stock stock-in">In stock</p>;
  }
}
