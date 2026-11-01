import type { AddOn } from "@/lib/catalog/configure";

export type CatalogImage = { src: string; alt: string };

export type CategoryRef = { slug: string; name: string };

export type Category = CategoryRef & {
  id: string;
  description: string;
  image: CatalogImage;
};

export type Occasion = CategoryRef & { image: CatalogImage };

export type StockState = "in-stock" | "low-stock" | "sold-out";

export type Product = {
  id: string;
  slug: string;
  name: string;
  pricing: "fixed" | "per_piece";
  /** Whole pesos, per item (fixed) or per flower (per_piece). */
  price: number;
  minPieces: number;
  madeToOrder: boolean;
  addOns: AddOn[];
  compareAtPrice?: number;
  images: CatalogImage[];
  category: CategoryRef;
  stock: number;
  isNewArrival: boolean;
  description: string;
  details: string[];
};
