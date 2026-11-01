export type NavLink = { label: string; href: string };

export const mainNav: NavLink[] = [
  { label: "New Arrivals", href: "/collections/new" },
  { label: "Bouquets", href: "/collections/bouquets" },
  { label: "Roses", href: "/collections/roses" },
  { label: "Occasions", href: "/occasions" },
  { label: "Plants", href: "/collections/plants" },
  { label: "Gifts", href: "/collections/gifts" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All flowers", href: "/collections/all" },
      { label: "Bouquets", href: "/collections/bouquets" },
      { label: "Vase arrangements", href: "/collections/vase-arrangements" },
      { label: "Plants", href: "/collections/plants" },
      { label: "Gifts & add-ons", href: "/collections/gifts" },
    ],
  },
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
