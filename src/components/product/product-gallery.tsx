"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { CatalogImage } from "@/types/catalog";

/**
 * Swipeable image strip with thumbnails. One scroll-snap track drives both
 * touch swiping on mobile and thumbnail clicks on larger screens.
 */
export function ProductGallery({ images }: { images: CatalogImage[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(index: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="lg:grid lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-4">
      <div className="relative lg:col-start-2">
        <div
          ref={trackRef}
          onScroll={onScroll}
          aria-label="Product images"
          tabIndex={0}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-media [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div
              key={img.src}
              className="media media-portrait w-full shrink-0 snap-center rounded-none"
              aria-hidden={i !== active}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                preload={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                sizes="(min-width: 64rem) 55vw, (min-width: 48rem) 50vw, 100vw"
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-2 md:hidden">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                onClick={() => goTo(i)}
                className={`size-2 rounded-pill transition-colors ${i === active ? "bg-ink" : "bg-line-strong"}`}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 hidden grid-cols-5 gap-2 md:grid lg:col-start-1 lg:row-start-1 lg:mt-0 lg:flex lg:flex-col">
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                onClick={() => goTo(i)}
                className={`media media-portrait block w-full rounded-control outline-offset-2 transition-opacity ${
                  i === active ? "outline-1 outline-ink" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={img.src} alt="" fill sizes="96px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
