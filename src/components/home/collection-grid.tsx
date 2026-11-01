import type { Category } from "@/types/catalog";
import { ScrollRow } from "@/components/layout/scroll-row";
import { CollectionCard } from "@/components/product/collection-card";
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
        {/* One row that scrolls sideways: ~1 card on phones (next one peeking), 2 on tablets, 3 on desktop. */}
        <ScrollRow
          label="collections"
          className="-mx-(--gutter) grid snap-x snap-mandatory auto-cols-[80%] grid-flow-col gap-[calc(var(--grid-gap)*2)] overflow-x-auto overscroll-x-contain px-(--gutter) scroll-px-(--gutter) [scrollbar-width:none] md:mx-0 md:auto-cols-[calc((100%-var(--grid-gap)*2)/2)] md:px-0 md:scroll-px-0 lg:auto-cols-[calc((100%-var(--grid-gap)*4)/3)] [&::-webkit-scrollbar]:hidden [&>li]:snap-start"
        >
          {collections.map((c) => (
            <li key={c.slug}>
              <CollectionCard collection={c} sizes="(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 80vw" />
            </li>
          ))}
        </ScrollRow>
      </div>
    </section>
  );
}
