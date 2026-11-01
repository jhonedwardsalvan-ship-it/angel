// Couriers an admin can pick when marking an order out for delivery. Pure; safe on client and server.

export const COURIERS = {
  lalamove: "Lalamove",
  grab: "Grab Express",
  jnt: "J&T Express",
  transportify: "Transportify",
  own: "Our own rider",
  other: "Other",
} as const;
export type Courier = keyof typeof COURIERS;

export function isCourier(value: string): value is Courier {
  return value in COURIERS;
}

export function courierLabel(value: string) {
  return isCourier(value) ? COURIERS[value] : "";
}

/** Rider/parcel tracking links from couriers. https only, so the link is safe to show buyers. */
export function isValidTrackingUrl(value: string) {
  if (value.length > 500) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
