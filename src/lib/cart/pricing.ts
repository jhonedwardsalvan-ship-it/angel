// Pricing rules shared by the cart, checkout and confirmation pages.
// Matches the "Free delivery over ₱2,500" promise in the announcement bar.

export const FREE_DELIVERY_MIN = 2500;
export const DELIVERY_FEE = 150;
export const MAX_QUANTITY_PER_LINE = 10;

export function deliveryFeeFor(subtotal: number) {
  return subtotal === 0 || subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
}
