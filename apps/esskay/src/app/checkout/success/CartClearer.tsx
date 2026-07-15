'use client'

import { useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'

export function CartClearer() {
  const { clear } = useCart()
  // cartStore.clear() mutates module state; not a React setState call.
  useEffect(() => { clear() }, [clear])
  return null
}
