import Link from "next/link";
import { PageSizeSelect } from "@/components/admin/page-size-select";

export function Pagination({ page, pages, href, limit = 20, showPageSize = true }: { page: number; pages: number; href: (page: number) => string; limit?: number; showPageSize?: boolean }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      {showPageSize ? <PageSizeSelect value={limit} /> : <span />}
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-4 text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="btn btn-outline btn-sm">Previous</Link> : <span />}
          <span className="text-ink-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="btn btn-outline btn-sm">Next</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
