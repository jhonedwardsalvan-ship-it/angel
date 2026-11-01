import Image from "next/image";
import Link from "next/link";
import type { CatalogImage } from "@/types/catalog";

export function EditorialSplit({ image }: { image: CatalogImage }) {
  return (
    <section className="section bg-surface" aria-labelledby="story-title">
      <div className="container-page grid items-center gap-10 md:grid-cols-2 lg:gap-20">
        <div className="media media-portrait">
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 48rem) 50vw, 100vw" />
        </div>
        <div className="stack max-w-md items-start gap-5">
          <p className="eyebrow">Our craft</p>
          <h2 id="story-title">Handmade blooms that never fade</h2>
          <p className="text-ink-muted">
            Every flower is shaped by hand from soft chenille, satin ribbon,
            crepe paper and felt, one petal at a time. They never wilt, need no
            water and keep their colour for years, so your gift becomes a
            keepsake, not just a bouquet.
          </p>
          <ul className="stack gap-3 text-sm">
            <li className="flex gap-3"><span className="text-primary">—</span>Handmade from chenille, satin ribbon, paper and felt</li>
            <li className="flex gap-3"><span className="text-primary">—</span>Lasts for years. No water, no wilting</li>
            <li className="flex gap-3"><span className="text-primary">—</span>Free handwritten message card</li>
          </ul>
          <Link href="/collections/new" className="btn btn-primary mt-2">
            Browse new arrivals
          </Link>
        </div>
      </div>
    </section>
  );
}
