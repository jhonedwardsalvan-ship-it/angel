// Search filters shared by the /search page (server) and its controls (client).

export const SEARCH_SORTS = ["featured", "newest", "price-asc", "price-desc"] as const;
export type SearchSort = (typeof SEARCH_SORTS)[number];

export const SEARCH_SORT_LABELS: Record<SearchSort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

export type SearchFilters = {
  q: string;
  /** Category slug, or "" for all categories. */
  category: string;
  inStock: boolean;
  sort: SearchSort;
};

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const str = (value: unknown) => (typeof first(value) === "string" ? (first(value) as string) : "");

/** Reads filters from URL search params, falling back to defaults for anything invalid. */
export function parseSearchParams(params: Record<string, string | string[] | undefined>): SearchFilters {
  const sort = str(params.sort);
  return {
    q: str(params.q).trim().slice(0, 100),
    category: str(params.category).toLowerCase(),
    inStock: str(params.stock) === "1",
    sort: (SEARCH_SORTS as readonly string[]).includes(sort) ? (sort as SearchSort) : "featured",
  };
}

/** Builds a /search URL, leaving defaults out so links stay short. */
export function searchHref(filters: SearchFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.inStock) params.set("stock", "1");
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}
