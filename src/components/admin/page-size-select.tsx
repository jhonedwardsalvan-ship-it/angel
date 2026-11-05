"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PageSizeSelect({ value }: { value: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changePageSize(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", nextValue);
    for (const key of ["page", "productPage", "historyPage"]) params.delete(key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-ink-muted">
      Rows per page
      <select className="input min-h-9 py-1 text-sm" value={value} onChange={(event) => changePageSize(event.target.value)}>
        {[20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
      </select>
    </label>
  );
}
