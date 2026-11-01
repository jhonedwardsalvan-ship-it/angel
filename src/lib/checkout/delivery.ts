// Delivery options shared by the checkout form (client) and order action (server).

export const DELIVERY_SLOTS = {
  morning: "Morning, 9 AM – 12 PM",
  afternoon: "Afternoon, 12 – 4 PM",
  evening: "Evening, 4 – 7 PM",
} as const;

export const PAYMENT_METHODS = {
  "demo-card": "Card (demo — no charge)",
  cod: "Cash on delivery",
} as const;

export const MAX_DELIVERY_DAYS_AHEAD = 60;

/** YYYY-MM-DD in the store's timezone, offset by `days`. */
export function storeDate(days = 0) {
  const d = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(d);
}
