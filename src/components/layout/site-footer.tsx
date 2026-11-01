import Link from "next/link";
import { footerNav } from "@/lib/navigation";

export function SiteFooter() {
  return (
    <footer className="bg-inverse text-ink-inverse">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-12 py-16 md:grid-cols-3 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:py-20">
        <div className="stack col-span-2 max-w-xs md:col-span-3 lg:col-span-1">
          <Link href="/" className="text-h3 tracking-[0.2em] uppercase">
            Angel
          </Link>
          <p className="text-sm text-ink-subtle">
            Fresh flowers and thoughtful gifts, arranged by hand and delivered
            the same day.
          </p>
          <ul className="flex gap-5 text-sm">
            <li><a href="#" className="text-ink-subtle transition-colors hover:text-ink-inverse">Instagram</a></li>
            <li><a href="#" className="text-ink-subtle transition-colors hover:text-ink-inverse">Facebook</a></li>
            <li><a href="#" className="text-ink-subtle transition-colors hover:text-ink-inverse">TikTok</a></li>
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
          <p>© {new Date().getFullYear()} Angel. All rights reserved.</p>
          <p>Prices in PHP · Secure checkout</p>
        </div>
      </div>
    </footer>
  );
}
