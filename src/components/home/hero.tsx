import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/icons";
import { SITE } from "@/lib/site";
import type { CatalogImage } from "@/types/catalog";

const socialIcons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  TikTok: TikTokIcon,
};

export function Hero({ image }: { image: CatalogImage }) {
  return (
    <section className="overflow-hidden bg-surface">
      <div className="container-page grid items-center gap-8 py-8 md:grid-cols-12 md:gap-8 md:py-16 lg:py-20">
        {/* The petal: two opposite corners rounded, with a lavender petal offset behind it for depth. */}
        <div className="relative mx-auto w-full max-w-68 md:order-last md:col-span-5 md:col-start-8 md:max-w-none">
          <div aria-hidden="true" className="hero-backdrop absolute inset-0 translate-x-3 translate-y-3 rounded-tl-[50%] rounded-br-[50%] bg-accent md:translate-x-5 md:translate-y-5" />
          <div className="hero-photo relative aspect-[5/6] overflow-hidden rounded-tl-[50%] rounded-br-[50%] md:aspect-[4/5]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload
              sizes="(min-width: 75rem) 30rem, (min-width: 48rem) 40vw, 24rem"
              className="object-cover"
            />
          </div>
        </div>

        <div className="hero-copy stack items-start gap-6 md:col-span-7 md:pr-6">
          <h1 className="text-[clamp(2.75rem,1.9rem+3.6vw,5rem)] leading-[1.02] font-light tracking-[-0.025em]">
            Flowers that say it better than words
          </h1>
          <p className="max-w-lg text-ink-muted md:text-lg">
            Handcrafted flowers that last for years, made for your date. Book 3–5 days ahead and we&apos;ll
            take care of the rest.
          </p>
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap">
            <Link href="/collections/bouquets" className="btn btn-lg btn-primary px-4 sm:px-10">
              Shop bouquets
            </Link>
            <Link href="/collections" className="btn btn-lg btn-outline px-4 sm:px-10">
              Browse collections
            </Link>
          </div>

          <div className="stack mt-4 gap-3 border-t border-line pt-6 md:mt-6">
            <p className="text-sm text-ink-muted">Follow our latest work</p>
            <ul className="flex gap-2">
              {SITE.socials.map((s) => {
                const Icon = socialIcons[s.label];
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.label}
                      className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-canvas text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ink-inverse"
                    >
                      {Icon && <Icon aria-hidden="true" width={18} height={18} />}
                      <span className="sr-only">{s.label} (opens in a new tab)</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
