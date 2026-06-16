import { describe, it, expect } from 'vitest'
import { qtyForSaleExceedsOnHand, clampQtyForSale } from '@/lib/qty-guard'

describe('qtyForSaleExceedsOnHand', () => {
  it('returns false when for_sale equals on_hand', () => {
    expect(qtyForSaleExceedsOnHand(5, 5)).toBe(false)
  })

  it('returns false when for_sale is below on_hand', () => {
    expect(qtyForSaleExceedsOnHand(3, 5)).toBe(false)
  })

  it('returns true when for_sale exceeds on_hand', () => {
    expect(qtyForSaleExceedsOnHand(6, 5)).toBe(true)
  })

  it('handles zero quantities', () => {
    expect(qtyForSaleExceedsOnHand(0, 0)).toBe(false)
    expect(qtyForSaleExceedsOnHand(1, 0)).toBe(true)
  })
})

describe('clampQtyForSale', () => {
  it('returns for_sale unchanged when it is below on_hand', () => {
    expect(clampQtyForSale(3, 5)).toBe(3)
  })

  it('returns for_sale unchanged when it equals on_hand', () => {
    expect(clampQtyForSale(5, 5)).toBe(5)
  })

  it('clamps for_sale to on_hand when it exceeds', () => {
    expect(clampQtyForSale(10, 5)).toBe(5)
  })

  it('handles zero on_hand', () => {
    expect(clampQtyForSale(3, 0)).toBe(0)
  })
})
