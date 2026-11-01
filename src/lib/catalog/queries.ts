import "server-only";
import type { Types } from "mongoose";
import { cache } from "react";
import { connectDB } from "@/lib/db/mongoose";
import { Category as CategoryModel, type CategoryDoc } from "@/models/category";
import { AddOn as AddOnModel } from "@/models/add-on";
import { Color as ColorModel } from "@/models/color";
import { Product as ProductModel, productColorIds, type ProductDoc } from "@/models/product";
import type { AddOn, ColorOption } from "@/lib/catalog/configure";
import type { SearchFilters, SearchSort } from "@/lib/catalog/search";
import type { Category, Product } from "@/types/catalog";

// Storefront read layer. Pages call these instead of touching models directly;
// every result is a plain object that is safe to pass to client components.

type CategoryRow = CategoryDoc & { _id: Types.ObjectId };
type PopulatedProductRow = Omit<ProductDoc, "category"> & {
  _id: Types.ObjectId;
  category: Pick<CategoryRow, "_id" | "name" | "slug"> | null;
};

const ACTIVE = { isActive: true } as const;

function toCategory(row: CategoryRow): Category {
  return {
    id: row._id.toString(),
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    image: { src: row.image.src, alt: row.image.alt },
  };
}

type SharedAddOn = AddOn & { appliesTo: string };

/** Active add-ons, loaded once per request. */
const getActiveAddOns = cache(async (): Promise<SharedAddOn[]> => {
  await connectDB();
  const rows = await AddOnModel.find({ isActive: true }).sort({ name: 1 }).lean();
  return rows.map((a) => ({ id: a._id.toString(), name: a.name, price: a.price, appliesTo: a.appliesTo ?? "selected" }));
});

/** Active colors, loaded once per request. */
const getActiveColors = cache(async (): Promise<ColorOption[]> => {
  await connectDB();
  const rows = await ColorModel.find({ isActive: true }).sort({ name: 1 }).lean();
  return rows.map((c) => ({ id: c._id.toString(), name: c.name, hex: c.hex }));
});

/** The active colors a product ticked, in name order. */
function colorsFor(ticked: Types.ObjectId[], all: ColorOption[]): ColorOption[] {
  const ids = new Set(ticked.map(String));
  return all.filter((c) => ids.has(c.id));
}

/** Add-ons offered on a product: every "all products" add-on plus the ones it ticked. */
function addOnsFor(ticked: Types.ObjectId[], all: SharedAddOn[]): AddOn[] {
  const ids = new Set(ticked.map(String));
  return all.filter((a) => a.appliesTo === "all" || ids.has(a.id)).map(({ id, name, price }) => ({ id, name, price }));
}

function toProduct(
  row: PopulatedProductRow & { category: NonNullable<PopulatedProductRow["category"]> },
  addOns: SharedAddOn[],
  colors: ColorOption[],
): Product {
  const colorIds = productColorIds(row);
  return {
    id: row._id.toString(),
    slug: row.slug,
    name: row.name,
    pricing: row.pricing === "per_piece" ? "per_piece" : "fixed",
    price: row.price,
    minPieces: row.minPieces ?? 5,
    madeToOrder: row.madeToOrder ?? false,
    addOns: addOnsFor(row.addOnIds ?? [], addOns),
    flowerColors: colorsFor(colorIds.flower, colors),
    wrapperColors: colorsFor(colorIds.wrapper, colors),
    compareAtPrice: row.compareAtPrice ?? undefined,
    images: row.images.map(({ src, alt }) => ({ src, alt })),
    category: { slug: row.category.slug, name: row.category.name },
    stock: row.stock,
    isNewArrival: row.isNewArrival,
    description: row.description ?? "",
    details: [...row.details],
  };
}

/** Runs a product query with the category joined; drops products whose category is inactive. */
async function findProducts(
  filter: Record<string, unknown>,
  { sort, limit }: { sort?: Record<string, 1 | -1>; limit?: number } = {},
): Promise<Product[]> {
  await connectDB();
  let query = ProductModel.find({ ...filter, ...ACTIVE })
    .populate<{ category: PopulatedProductRow["category"] }>({
      path: "category",
      select: "name slug",
      match: ACTIVE,
    })
    // _id breaks ties between documents created in the same batch.
    .sort(sort ?? { createdAt: 1, _id: 1 });
  if (limit) query = query.limit(limit);

  const [rows, addOns, colors] = await Promise.all([query.lean() as Promise<PopulatedProductRow[]>, getActiveAddOns(), getActiveColors()]);
  return rows.flatMap((row) => (row.category ? [toProduct({ ...row, category: row.category }, addOns, colors)] : []));
}

export async function getCategories(): Promise<Category[]> {
  await connectDB();
  const rows = await CategoryModel.find(ACTIVE).sort({ sortOrder: 1, name: 1 }).lean<CategoryRow[]>();
  return rows.map(toCategory);
}

/** Live categories marked "Show in the main menu", in sort order. Cached per request. */
export const getMenuCategories = cache(async (): Promise<Category[]> => {
  await connectDB();
  const rows = await CategoryModel.find({ ...ACTIVE, showInMenu: true }).sort({ sortOrder: 1, name: 1 }).lean<CategoryRow[]>();
  return rows.map(toCategory);
});

/** Cached per request so generateMetadata and the page share one query. */
export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  await connectDB();
  const row = await CategoryModel.findOne({ slug: slug.toLowerCase(), ...ACTIVE }).lean<CategoryRow>();
  return row ? toCategory(row) : null;
});

/** Active products by id, in no particular order. */
export function getProductsByIds(ids: string[]) {
  return findProducts({ _id: { $in: ids } });
}

export function getProductsByCategory(category: Category, limit = 48) {
  return findProducts({ category: category.id }, { limit });
}

export function getFeaturedProducts(limit = 8) {
  return findProducts({ isFeatured: true }, { limit });
}

export function getNewArrivals(limit = 8) {
  return findProducts({ isNewArrival: true }, { sort: { createdAt: -1, _id: -1 }, limit });
}

/** Cached per request so generateMetadata and the page share one query. */
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const [product] = await findProducts({ slug: slug.toLowerCase() }, { limit: 1 });
  return product ?? null;
});

/** Same-category products first, topped up with featured products. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  await connectDB();
  const category = await CategoryModel.findOne({ slug: product.category.slug }, { _id: 1 }).lean();
  const excludeIds = [product.id];

  const sameCategory = category
    ? await findProducts({ category: category._id, _id: { $nin: excludeIds } }, { limit })
    : [];
  if (sameCategory.length >= limit) return sameCategory;

  const fillers = await findProducts(
    { isFeatured: true, _id: { $nin: [...excludeIds, ...sameCategory.map((p) => p.id)] } },
    { limit: limit - sameCategory.length },
  );
  return [...sameCategory, ...fillers];
}

const SEARCH_SORT_ORDER: Record<SearchSort, Record<string, 1 | -1>> = {
  featured: { isFeatured: -1, createdAt: 1, _id: 1 },
  newest: { createdAt: -1, _id: -1 },
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: 1 },
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Case-insensitive match on name, description and details, combined with
 * optional category and stock filters. A regex scan is fine at catalog size;
 * switch to a text or Atlas Search index if the catalog grows large.
 */
export async function searchProducts(
  { q, category, inStock, sort = "featured" }: Partial<SearchFilters>,
  limit = 48,
): Promise<Product[]> {
  const filter: Record<string, unknown> = {};

  const term = q?.trim().slice(0, 100);
  if (term) {
    const pattern = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ name: pattern }, { description: pattern }, { details: pattern }];
  }
  if (category) {
    const match = await getCategoryBySlug(category);
    if (!match) return [];
    filter.category = match.id;
  }
  if (inStock) filter.$and = [{ $or: [{ stock: { $gt: 0 } }, { madeToOrder: true }, { pricing: "per_piece" }] }];

  return findProducts(filter, { sort: SEARCH_SORT_ORDER[sort], limit });
}
