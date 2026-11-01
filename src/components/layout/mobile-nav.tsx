"use client";

import Link from "next/link";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, MenuIcon } from "@/components/icons";
import type { NavLink } from "@/lib/navigation";

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards, so the portal target exists. */
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const drawer = (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-inverse/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <nav
        id={panelId}
        aria-label="Main"
        inert={!open}
        className={`absolute inset-y-0 left-0 flex w-[min(22rem,85vw)] flex-col bg-canvas transition-transform duration-300 ease-standard ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-(--header-h) items-center justify-between border-b border-line px-(--gutter)">
          <span className="eyebrow">Menu</span>
          <button
            type="button"
            className="btn-icon"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-(--gutter) py-4">
          {links.map((link) => (
            <li key={link.href} className="border-b border-line">
              <Link
                href={link.href}
                className="block py-4 text-h4"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="stack gap-3 border-t border-line p-(--gutter)">
          <Link href="/account" className="btn btn-outline btn-block" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="btn-icon lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>

      {/* Portal to <body>: the header's backdrop-filter makes it the containing
          block for fixed children, which would clip the drawer to the header. */}
      {isClient && createPortal(drawer, document.body)}
    </>
  );
}
