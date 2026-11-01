import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types/catalog";
import { SectionHeading } from "./section-heading";

export function CollectionGrid({ collections }: { collections: Category[] }) {
  return (
    <section className="section" aria-labelledby="collections-title">
      <div className="container-page">
        <SectionHeading
          id="collections-title"
          eyebrow="Shop the collections"
          title="Something for every moment"
          action={{ label: "View all", href: "/collections" }}
        />
        <ul className="grid-collections">
          {collections.map((c) => (
            <li key={c.slug}>
              <Link href={`/collections/${c.slug}`} className="group block">
                <div className="media media-portrait">
                  <Image
                    src={c.image.src}
                    alt={c.image.alt}
                    fill
                    sizes="(min-width: 64rem) 33vw, 50vw"
                    className="transition-transform duration-700 ease-standard group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-inverse/70 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-ink-inverse md:p-6">
                    <h3 className="text-h4 text-ink-inverse md:text-h3">{c.name}</h3>
                    <p className="mt-1 hidden text-sm text-ink-inverse/80 sm:block">
                      {c.description}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
