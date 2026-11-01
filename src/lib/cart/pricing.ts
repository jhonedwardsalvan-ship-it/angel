// Pricing rules shared by the cart, checkout and confirmation pages.
// The delivery fee and free-delivery minimum come from store settings (Admin → Settings).

export const MAX_QUANTITY_PER_LINE = 10;

type DeliveryRules = { deliveryFee: number; freeDeliveryMin: number };

/** A freeDeliveryMin of 0 means delivery is never free. */
export function deliveryFeeFor(subtotal: number, { deliveryFee, freeDeliveryMin }: DeliveryRules) {
  if (subtotal === 0) return 0;
  return freeDeliveryMin > 0 && subtotal >= freeDeliveryMin ? 0 : deliveryFee;
}
