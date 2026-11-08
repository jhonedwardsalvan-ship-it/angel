"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatedDots, BloomingFlower } from "./blooming";

const SHOW_AFTER_MS = 200; // fast navigations finish before this, so they never flash the overlay
const GIVE_UP_AFTER_MS = 8000;

/** Same-site URL of a click or GET form submit that leads to another page, or null. */
function destination(event: Event): URL | null {
  if (event instanceof MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
    const a = (event.target as Element | null)?.closest?.("a");
    if (!a || !a.href || (a.target && a.target !== "_self") || a.hasAttribute("download")) return null;
    return new URL(a.href);
  }
  const form = event.target as HTMLFormElement;
  if (form.method.toLowerCase() !== "get" || !form.action) return null;
  const url = new URL(form.action);
  url.search = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
  return url;
}

/**
 * While the next page loads, blurs the current one and shows the flower in a
 * small modal. Covers in-site link clicks and GET forms (search).
 */
export function NavigationOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const here = `${pathname}?${searchParams}`;
  // The page a slow navigation started from. Once the URL changes the navigation
  // has finished, so the overlay hides itself without any extra state update.
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  // Clear completed navigations instead of retaining their old source URL.
  // Otherwise navigating back to that URL can make a stale overlay reappear.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPendingFrom(null);
  }, [here]);

  useEffect(() => {
    function onNavigate(event: Event) {
      const url = destination(event);
      if (!url || url.origin !== location.origin) return;
      // Same page (or just a #section on it): nothing to load.
      if (url.pathname === location.pathname && url.search === location.search) return;
      // Same format as `here` (URLSearchParams encoding) so the comparison holds.
      const from = `${location.pathname}?${new URLSearchParams(location.search)}`;
      const pending = timers.current;
      pending.forEach(clearTimeout);
      pending.length = 0;
      setPendingFrom(null);
      pending.push(
        window.setTimeout(() => setPendingFrom(from), SHOW_AFTER_MS),
        window.setTimeout(() => setPendingFrom(null), GIVE_UP_AFTER_MS),
      );
    }
    // Capture phase: Next.js <Link> (and the search form) cancel the browser's own
    // navigation to run a client-side one, so by the bubble phase the event looks cancelled.
    document.addEventListener("click", onNavigate, true);
    document.addEventListener("submit", onNavigate, true);
    const pending = timers.current;
    return () => {
      document.removeEventListener("click", onNavigate, true);
      document.removeEventListener("submit", onNavigate, true);
      pending.forEach(clearTimeout);
    };
  }, []);

  if (pendingFrom === null || pendingFrom !== here) return null;
  return (
    <div className="fixed inset-0 z-60 grid place-items-center bg-canvas/30 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="panel stack items-center gap-3 px-10 py-8 text-center shadow-lg">
        <BloomingFlower className="size-16" />
        <p className="text-h4" aria-label="Flowering, loading">
          Flowering
          <AnimatedDots />
        </p>
      </div>
    </div>
  );
}
