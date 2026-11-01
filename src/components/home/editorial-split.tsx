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
          <h2 id="story-title">Arranged the morning they leave our studio</h2>
          <p className="text-ink-muted">
            We buy from local growers several times a week, so every stem
            arrives at its peak. Each arrangement is wrapped by hand, finished
            with a handwritten card, and sent out in a cooled vehicle.
          </p>
          <ul className="stack gap-3 text-sm">
            <li className="flex gap-3"><span className="text-primary">—</span>Locally sourced, seasonal stems</li>
            <li className="flex gap-3"><span className="text-primary">—</span>Free handwritten message card</li>
            <li className="flex gap-3"><span className="text-primary">—</span>Photo of your arrangement before dispatch</li>
          </ul>
          <Link href="/pages/about" className="btn btn-primary mt-2">
            Read our story
          </Link>
        </div>
      </div>
    </section>
  );
}
