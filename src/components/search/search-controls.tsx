"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SearchIcon } from "@/components/icons";
import {
  SEARCH_SORTS,
  SEARCH_SORT_LABELS,
  searchHref,
  type SearchFilters,
  type SearchSort,
} from "@/lib/catalog/search";
import type { CategoryRef } from "@/types/catalog";

type SearchControlsProps = {
  filters: SearchFilters;
  categories: CategoryRef[];
};

/**
 * Search box, category chips, stock toggle and sort. A plain GET form, so it
 * works without JavaScript; with JS, changes update the URL in place.
 */
export function SearchControls({ filters, categories }: SearchControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const apply = (patch: Partial<SearchFilters>) =>
    startTransition(() => router.push(searchHref({ ...filters, ...patch }), { scroll: false }));

  return (
    <form
      action="/search"
      role="search"
      aria-busy={pending}
      className={`stack gap-5 transition-opacity ${pending ? "opacity-60" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        apply({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
      }}
    >
      <div className="flex gap-2">
        <label htmlFor="search-q" className="sr-only">
          Search products
        </label>
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted" width={20} height={20} />
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            key={filters.q}
            placeholder="Roses, tulips, gift box…"
            autoComplete="off"
            enterKeyHint="search"
            autoFocus={!filters.q}
            className="input pl-11"
          />
        </div>
        <button type="submit" className="btn btn-primary shrink-0">
          Search
        </button>
      </div>

      {/* Keep the other filters when the form is submitted without JS. */}
      {filters.category && <input type="hidden" name="category" value={filters.category} />}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter by category" className="-mx-(--gutter) overflow-x-auto px-(--gutter) [scrollbar-width:none] md:mx-0 md:px-0">
          <ul className="flex w-max gap-2">
            {[{ slug: "", name: "All" }, ...categories].map((c) => {
              const active = filters.category === c.slug;
              return (
                <li key={c.slug || "all"}>
                  <Link
                    href={searchHref({ ...filters, category: c.slug })}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className="chip whitespace-nowrap"
                    onClick={(e) => {
                      e.preventDefault();
                      apply({ category: c.slug });
                    }}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center justify-between gap-4 md:justify-end">
          <label className="flex cursor-pointer items-center gap-2 text-sm whitespace-nowrap">
            <input
              type="checkbox"
              name="stock"
              value="1"
              defaultChecked={filters.inStock}
              key={`stock-${filters.inStock}`}
              className="size-4 accent-primary"
              onChange={(e) => apply({ inStock: e.currentTarget.checked })}
            />
            In stock only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-muted whitespace-nowrap">Sort by</span>
            <select
              name="sort"
              defaultValue={filters.sort}
              key={`sort-${filters.sort}`}
              className="input min-h-10 w-auto py-2 pr-8 text-sm"
              onChange={(e) => apply({ sort: e.currentTarget.value as SearchSort })}
            >
              {SEARCH_SORTS.map((s) => (
                <option key={s} value={s}>
                  {SEARCH_SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </form>
  );
}
