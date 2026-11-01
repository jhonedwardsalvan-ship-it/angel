import Link from "next/link";
import { getCategories } from "@/lib/catalog/queries";
import { footerNavFor } from "@/lib/navigation";
import { SITE } from "@/lib/site";
import { LogoBadge } from "./logo";

export async function SiteFooter() {
  const footerNav = footerNavFor(await getCategories());
  return (
    <footer className="bg-inverse text-ink-inverse">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-12 py-16 md:grid-cols-3 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:py-20">
        <div className="stack col-span-2 max-w-xs md:col-span-3 lg:col-span-1">
          <Link href="/" className="w-fit">
            <LogoBadge className="size-28" tone="light" />
          </Link>
          <p className="text-sm text-ink-subtle">
            Fresh flowers and thoughtful gifts, arranged by hand. Book 3–5 days
            ahead of your date.
          </p>
          <a href={SITE.phoneHref} className="w-fit text-sm text-ink-inverse/75 transition-colors hover:text-ink-inverse">
            {SITE.phone}
          </a>
          <ul className="flex gap-5 text-sm">
            {SITE.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-ink-subtle transition-colors hover:text-ink-inverse">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title} className="stack">
            <h2 className="eyebrow text-ink-subtle">{group.title}</h2>
            <ul className="stack gap-3 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ink-inverse/75 underline-offset-4 transition-colors hover:text-ink-inverse hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-ink-inverse/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-ink-subtle sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} AL Flower Shop. All rights reserved.</p>
          <p>Prices in PHP · Book 3–5 days ahead</p>
        </div>
      </div>
    </footer>
  );
}
