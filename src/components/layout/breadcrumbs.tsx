import Link from "next/link";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string };

/** Trail of links ending in the current page (the last crumb, without href). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 md:mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted md:text-sm">
        {items.map((item, i) => (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && <li aria-hidden="true">/</li>}
            {item.href ? (
              <li><Link href={item.href} className="link-quiet">{item.label}</Link></li>
            ) : (
              <li aria-current="page" className="text-ink">{item.label}</li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
