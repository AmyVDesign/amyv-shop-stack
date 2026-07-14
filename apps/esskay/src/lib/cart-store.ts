const CART_KEY = 'esskay-cart'

export interface CartItem {
  productId: string
  title: string
  priceCents: number
  slug: string
}

type Listener = () => void
const listeners = new Set<Listener>()
let _items: CartItem[] = []

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

  getServerSnapshot(): CartItem[] { return [] },

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
