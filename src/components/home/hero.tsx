import Image from "next/image";
import Link from "next/link";
import type { CatalogImage } from "@/types/catalog";

export function Hero({ image }: { image: CatalogImage }) {
  return (
    <section className="relative isolate flex min-h-[min(78svh,44rem)] items-end overflow-hidden bg-inverse md:items-center">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        preload
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-inverse/80 via-inverse/30 to-transparent md:bg-linear-to-r md:from-inverse/70 md:via-inverse/25"
      />
      <div className="container-page py-12 md:py-20">
        <div className="stack max-w-xl items-start gap-5 text-ink-inverse">
          <p className="eyebrow text-ink-inverse/80">Fresh this week</p>
          <h1 className="text-display text-ink-inverse">
            Flowers that say it better than words
          </h1>
          <p className="max-w-md text-ink-inverse/85 md:text-lg">
            Seasonal blooms arranged by hand each morning and delivered to
            their door the same day.
          </p>
          <div className="mt-2 grid w-full gap-3 sm:flex sm:w-auto sm:flex-wrap">
            <Link href="/collections/bouquets" className="btn btn-lg bg-canvas text-ink hover:bg-surface">
              Shop bouquets
            </Link>
            <Link
              href="/occasions"
              className="btn btn-lg border-ink-inverse/70 text-ink-inverse hover:bg-canvas hover:text-ink"
            >
              Find by occasion
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
