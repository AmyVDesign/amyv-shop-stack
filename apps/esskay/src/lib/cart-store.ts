const CART_KEY = 'esskay-cart'

export interface CartItem {
  productId: string
  title: string
  priceCents: number
  slug: string
  quantity: number
  // Advisory: stock at add time. Cart stepper uses this as its max. Checkout
  // validates server-side, so stale values here are safe.
  maxQty: number
}

type Listener = () => void
const listeners = new Set<Listener>()
// _items is only ever replaced (never mutated), so getSnapshot() returning
// _items is referentially stable between changes.
let _items: CartItem[] = []
// Stable empty-array reference for SSR: useSyncExternalStore requires
// getServerSnapshot to return the same reference when the value hasn't changed.
const EMPTY_CART: CartItem[] = []

function notify() {
  for (const l of listeners) l()
}

function persist(items: CartItem[]) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)) } catch {}
}

export const cartStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  getSnapshot(): CartItem[] { return _items },

  getServerSnapshot(): CartItem[] { return EMPTY_CART },

  init() {
    try {
      const raw = localStorage.getItem(CART_KEY)
      _items = raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      _items = []
    }
    notify()
  },

  add(item: CartItem): 'added' | 'already_in_cart' {
    if (_items.some((i) => i.productId === item.productId)) return 'already_in_cart'
    _items = [..._items, item]
    persist(_items)
    notify()
    return 'added'
  },

  updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) {
      _items = _items.filter((i) => i.productId !== productId)
    } else {
      _items = _items.map((i) => i.productId === productId ? { ...i, quantity } : i)
    }
    persist(_items)
    notify()
  },

  remove(productId: string) {
    _items = _items.filter((i) => i.productId !== productId)
    persist(_items)
    notify()
  },

  clear() {
    _items = []
    persist(_items)
    notify()
  },
}
