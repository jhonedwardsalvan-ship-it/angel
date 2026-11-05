export const ADMIN_PAGE_SIZES = [20, 50, 100] as const;

export function readPageSize(value: unknown): number {
  const size = Number.parseInt(String(value ?? "20"), 10);
  return ADMIN_PAGE_SIZES.includes(size as (typeof ADMIN_PAGE_SIZES)[number]) ? size : 20;
}

export function readPage(value: unknown): number {
  return Math.max(1, Number.parseInt(String(value ?? "1"), 10) || 1);
}
