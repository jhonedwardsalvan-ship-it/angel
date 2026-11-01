import Link from "next/link";
import { BagIcon, SearchIcon, UserIcon } from "@/components/icons";
import { getCart } from "@/lib/cart/get-cart";
import { mainNav } from "@/lib/navigation";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const { itemCount } = await getCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="container-page grid h-(--header-h) grid-cols-[1fr_auto_1fr] items-center gap-4 lg:grid-cols-[auto_1fr_auto]">
        <div className="flex items-center lg:hidden">
          <MobileNav links={mainNav} />
          <Link href="/search" className="btn-icon" aria-label="Search">
            <SearchIcon />
          </Link>
        </div>

        <Link
          href="/"
          className="justify-self-center text-h3 tracking-[0.2em] uppercase lg:justify-self-start"
        >
          Angel
        </Link>

        <nav aria-label="Main" className="hidden justify-center lg:flex">
          <ul className="flex items-center gap-8 text-sm">
            {mainNav.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="link-quiet">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-self-end">
          <Link href="/search" className="btn-icon hidden lg:inline-grid" aria-label="Search">
            <SearchIcon />
          </Link>
          <Link href="/account" className="btn-icon hidden sm:inline-grid" aria-label="Account">
            <UserIcon />
          </Link>
          <Link
            href="/cart"
            className="btn-icon relative"
            aria-label={itemCount ? `Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}` : "Cart, empty"}
          >
            <BagIcon />
            {itemCount > 0 && (
              <span className="absolute top-1 right-0.5 grid h-4 min-w-4 place-items-center rounded-pill bg-primary px-1 text-[10px] leading-none text-primary-foreground">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
