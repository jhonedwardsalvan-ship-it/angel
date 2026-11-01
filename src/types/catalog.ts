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
  /** Whole pesos. */
  price: number;
  compareAtPrice?: number;
  images: CatalogImage[];
  category: CategoryRef;
  stock: number;
  isNewArrival: boolean;
  description: string;
  details: string[];
};
