'use client'

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
import { cartStore } from '@/lib/cart-store'
import type { CartItem } from '@/lib/cart-store'

export type { CartItem }

interface CartContextValue {
  items: CartItem[]
  add: (item: CartItem) => 'added' | 'already_in_cart'
  updateQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  )

  // Load from localStorage on client mount; cartStore.init() mutates module
  // state and notifies useSyncExternalStore -- not a React setState call.
  useEffect(() => { cartStore.init() }, [])

  return (
    <CartContext.Provider
      value={{
        items,
        add: cartStore.add,
        updateQuantity: cartStore.updateQuantity,
        remove: cartStore.remove,
        clear: cartStore.clear,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
