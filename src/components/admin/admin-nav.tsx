"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/add-ons", label: "Add-ons" },
  { href: "/admin/settings", label: "Settings" },
];

/** Sidebar on desktop, horizontally scrolling tabs on small screens. */
export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <nav aria-label="Admin" className="-mx-(--gutter) overflow-x-auto px-(--gutter) [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex w-max gap-1 lg:w-auto lg:flex-col">
        {LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-control px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  active ? "bg-ink text-ink-inverse" : "text-ink-muted hover:bg-surface hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
