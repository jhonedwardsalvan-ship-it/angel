import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types/catalog";

/** Photo card for a collection (category), used on the homepage row and the Collections page. */
export function CollectionCard({ collection, sizes }: { collection: Category; sizes: string }) {
  return (
    <Link href={`/collections/${collection.slug}`} className="group block">
      <div className="media media-portrait">
        <Image
          src={collection.image.src}
          alt={collection.image.alt}
          fill
          sizes={sizes}
          className="transition-transform duration-700 ease-standard group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-inverse/70 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-4 text-ink-inverse md:p-6">
          <h3 className="text-h4 text-ink-inverse md:text-h3">{collection.name}</h3>
          <p className="mt-1 hidden text-sm text-ink-inverse/80 sm:block">
            {collection.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
