import type { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";

/** Simple text page (Terms, Privacy, Contact): breadcrumb, title and readable column. */
export function ProsePage({ title, eyebrow, updated, children }: { title: string; eyebrow?: string; updated?: string; children: ReactNode }) {
  return (
    <div className="container-prose pt-4 pb-(--section-y) md:pt-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
      <header className="stack mb-8 gap-3 md:mb-10">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="text-h2">{title}</h1>
        {updated && <p className="text-sm text-ink-muted">Last updated {updated}</p>}
      </header>
      <div className="stack gap-8 text-ink-muted [&_h2]:mb-3 [&_h2]:text-h4 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-ink [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </div>
  );
}
