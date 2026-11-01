"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";

/**
 * A horizontally scrolling list with ← → buttons on larger
 * screens, shown only when there's more to scroll that way. Touch users swipe.
 */
export function ScrollRow({ className, label, children }: { className: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });
  const button = "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-pill bg-canvas/95 text-ink shadow-md transition-opacity hover:bg-canvas md:grid";

  return (
    <div className="relative">
      <ul ref={ref} className={className} aria-label={label}>
        {children}
      </ul>
      {!edges.start && (
        <button type="button" onClick={() => scroll(-1)} className={`${button} -left-5`} aria-label={`Scroll ${label} back`}>
          <ArrowRightIcon className="rotate-180" />
        </button>
      )}
      {!edges.end && (
        <button type="button" onClick={() => scroll(1)} className={`${button} -right-5`} aria-label={`Scroll ${label} forward`}>
          <ArrowRightIcon />
        </button>
      )}
    </div>
  );
}
