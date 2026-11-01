// Shop name, contact details and social profiles. Pure; safe on client and server.

export const SITE = {
  name: "AL Flower Shop",
  phone: "0905 525 7186",
  phoneHref: "tel:+639055257186",
  smsHref: "sms:+639055257186",
  /** Not set up yet. Pages hide the email line while this is null. */
  email: null as string | null,
  socials: [
    { label: "Facebook", href: "https://www.facebook.com/share/19pgh1b28w/" },
    { label: "Instagram", href: "https://www.instagram.com/lagazon.angelica" },
    { label: "TikTok", href: "https://www.tiktok.com/@a.l.l.crafts" },
  ],
};
