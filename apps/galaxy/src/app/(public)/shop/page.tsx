// TEMP: hardcoded products. Replace with Supabase fetch when database is wired up.

import Link from "next/link";

const PRODUCTS = [
  { slug: "standard-totem",      name: "Standard Totem",      price: 285, blurb: "36in waterproof LED totem"           },
  { slug: "pro-totem",           name: "Pro Totem",           price: 425, blurb: "48in with extended battery"          },
  { slug: "mini-totem",          name: "Mini Totem",          price: 195, blurb: "24in compact build"                  },
  { slug: "festival-pack",       name: "Festival Pack",       price: 750, blurb: "Two totems + carrying case"          },
  { slug: "custom-build",        name: "Custom Build",        price: 500, blurb: "Fully custom totem to your specs"    },
  { slug: "replacement-battery", name: "Replacement Battery", price: 65,  blurb: "Spare battery pack"                  },
];

// Gradient placeholder palettes — one per card slot, cycling if more cards added.
// Each entry: [cssGradient]. Uses site-accent + complementary hues so no two cards are identical.
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #39ff1422 0%, #0a0a0f 60%, #1a0a2e 100%)",   // green → deep purple
  "linear-gradient(160deg, #9d3cff22 0%, #0a0a0f 55%, #0a1a1a 100%)",   // purple → dark teal
  "linear-gradient(115deg, #00ffff18 0%, #0a0a0f 50%, #1a0a0a 100%)",   // cyan → dark red
  "linear-gradient(145deg, #ff10f018 0%, #0a0a0f 55%, #0a0a1a 100%)",   // pink → dark blue
  "linear-gradient(125deg, #39ff1418 0%, #1a0a0a 50%, #0a0a0f 100%)",   // green → dark red
  "linear-gradient(170deg, #ff8c0018 0%, #0a0a0f 60%, #0a1a00 100%)",   // orange → dark green
];

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">

      {/* ── Page header ──────────────────────────────────────────── */}
      <header className="mb-12">
        <p className="mb-2 text-[10px] uppercase tracking-[0.5em] text-site-muted">
          Shop
        </p>
        <h1 className="mb-3 text-4xl font-black uppercase leading-none sm:text-5xl">
          Custom LED Totems
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-site-muted">
          Handbuilt in San Francisco. Fully waterproof, festival-ready, built
          to your specs.
        </p>
      </header>

      {/* ── Product grid ─────────────────────────────────────────── */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((product, i) => (
          <li key={product.slug}>
            <Link
              href={`/shop/${product.slug}`}
              className="group flex flex-col border border-site-border bg-site-bg-alt transition-colors hover:border-site-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-accent"
            >
              {/* Image placeholder */}
              <div
                className="aspect-[3/4] w-full"
                style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
              />

              {/* Card content */}
              <div className="flex flex-col gap-1 p-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-site-text">
                  {product.name}
                </h2>
                <p className="text-xs text-site-muted">{product.blurb}</p>
                <p className="mt-2 text-base font-semibold text-site-accent">
                  ${product.price.toLocaleString()}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

    </div>
  );
}
