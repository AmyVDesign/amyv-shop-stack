/**
 * qty_for_sale must never exceed qty_on_hand.
 * This rule is enforced in both the server action (clamping) and the form
 * (client-side error). The helper is the single source of truth for tests.
 */

export function qtyForSaleExceedsOnHand(qtyForSale: number, qtyOnHand: number): boolean {
  return qtyForSale > qtyOnHand
}

export function clampQtyForSale(qtyForSale: number, qtyOnHand: number): number {
  return Math.min(qtyForSale, qtyOnHand)
}
