import type { CatalogImage } from "@/types/catalog";

const UNSPLASH = "https://images.unsplash.com/photo-";

export function unsplash(id: string, alt: string, width = 1200): CatalogImage {
  return { src: `${UNSPLASH}${id}?auto=format&fit=crop&w=${width}&q=80`, alt };
}

/** Zoomed crop of the same photo, used as a close-up gallery shot. */
export function unsplashCloseUp(id: string, alt: string, fpY = 0.4, zoom = 2): CatalogImage {
  return {
    src: `${UNSPLASH}${id}?auto=format&fit=crop&w=1400&h=1750&crop=focalpoint&fp-x=0.5&fp-y=${fpY}&fp-z=${zoom}&q=80`,
    alt,
  };
}
