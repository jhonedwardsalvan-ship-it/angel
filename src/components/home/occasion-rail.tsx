import Image from "next/image";
import Link from "next/link";
import type { Occasion } from "@/types/catalog";
import { SectionHeading } from "./section-heading";

export function OccasionRail({ occasions }: { occasions: Occasion[] }) {
  return (
    <section className="section" aria-labelledby="occasions-title">
      <div className="container-page">
        <SectionHeading
          id="occasions-title"
          eyebrow="Shop by occasion"
          title="Whatever you're celebrating"
          action={{ label: "All occasions", href: "/occasions" }}
        />
        <ul className="rail -mx-(--gutter) px-(--gutter) scroll-px-(--gutter) md:mx-0 md:px-0 md:scroll-px-0 lg:auto-cols-[calc((100%-var(--grid-gap)*5)/6)]">
          {occasions.map((o) => (
            <li key={o.slug}>
              <Link href={`/occasions/${o.slug}`} className="group stack gap-3">
                <div className="media rounded-pill">
                  <Image
                    src={o.image.src}
                    alt={o.image.alt}
                    fill
                    sizes="(min-width: 64rem) 16vw, (min-width: 48rem) 33vw, 46vw"
                    className="transition-transform duration-700 ease-standard group-hover:scale-105"
                  />
                </div>
                <span className="text-center text-sm group-hover:underline group-hover:underline-offset-4 md:text-base">
                  {o.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
