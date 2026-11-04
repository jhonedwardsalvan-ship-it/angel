import { CollectionGrid } from "@/components/home/collection-grid";
import { EditorialSplit } from "@/components/home/editorial-split";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { OccasionRail } from "@/components/home/occasion-rail";
import { ProductSection } from "@/components/home/product-section";
import { ServicePromises } from "@/components/home/service-promises";
import { TikTokSection } from "@/components/home/tiktok-section";
import { getCategories, getFeaturedProducts, getNewArrivals } from "@/lib/catalog/queries";
import { heroImage, occasions, storyImage } from "@/lib/content/home";
import { getStoreTikTokVideos } from "@/lib/tiktok/queries";

// Render per request so stock and catalog changes show up immediately.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, featured, newArrivals, tiktokVideos] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getNewArrivals(),
    // A TikTok problem shouldn't take the home page down; the section just hides.
    getStoreTikTokVideos().catch(() => []),
  ]);

  return (
    <>
      <Hero image={heroImage} />
      <ServicePromises />
      {categories.length > 0 && <CollectionGrid collections={categories} />}
      <ProductSection
        id="best-sellers-title"
        eyebrow="Most loved"
        title="Best sellers"
        products={featured}
        href="/collections/best-sellers"
        banded
      />
      <OccasionRail occasions={occasions} />
      <EditorialSplit image={storyImage} />
      <TikTokSection videos={tiktokVideos} />
      <ProductSection
        id="new-arrivals-title"
        eyebrow="Just in"
        title="New arrivals"
        products={newArrivals}
        href="/collections/new"
        layout="rail"
      />
      <Newsletter />
    </>
  );
}
