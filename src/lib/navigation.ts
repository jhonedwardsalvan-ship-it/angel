export type NavLink = { label: string; href: string };

type MenuCategory = { name: string; slug: string };

const categoryLink = (c: MenuCategory): NavLink => ({ label: c.name, href: `/collections/${c.slug}` });

/**
 * Top menu: "New Arrivals" is always first, then the categories chosen in
 * Admin → Categories, then "Bloom" (the TikTok video feed) once any video is shown.
 */
export function mainNavFor(menuCategories: MenuCategory[], showBloom = false): NavLink[] {
  return [
    { label: "New Arrivals", href: "/collections/new" },
    ...menuCategories.map(categoryLink),
    ...(showBloom ? [{ label: "Bloom", href: "/bloom" }] : []),
  ];
}

/** Footer columns: "Shop" lists every live category, Help and Company are fixed. */
export function footerNavFor(categories: MenuCategory[]): { title: string; links: NavLink[] }[] {
  return [
    { title: "Shop", links: [{ label: "New Arrivals", href: "/collections/new" }, ...categories.map(categoryLink)] },
    ...FOOTER_FIXED,
  ];
}

const FOOTER_FIXED: { title: string; links: NavLink[] }[] = [
  {
    title: "Help",
    links: [
      { label: "Track an order", href: "/orders" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];
