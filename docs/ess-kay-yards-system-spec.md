# Ess-Kay Yards Custom Platform: System Spec

A custom e-commerce platform purpose-built for salvage marine parts, with AI-powered product creation and an inventory model that fits one-off, hard-to-find inventory.

---

## Overview

### Goals

1. Replace Shopify with a custom platform that fits salvage-parts reality (one-off SKUs, dated arrivals, auto-redirect on sold)
2. Cut product creation time from ~10 minutes per SKU to ~30 seconds via AI vision
3. Bake SEO into every product page at the data model level
4. Eliminate Shopify subscription + app costs forever

### Tech stack

| Layer | Tool | Why |
|-------|------|-----|
| Frontend & API | Next.js 14+ (App Router) | SSG/ISR for SEO-perfect product pages |
| Hosting | Vercel | Edge functions, fast deploys, free for low traffic |
| Database | Supabase (PostgreSQL) | Auth, storage, postgres full-text search built in |
| Payments | Stripe Checkout (hosted) | Handles tax, payment methods, PCI compliance |
| AI | Anthropic API (Claude with vision) | Multi-image extraction, product field generation |
| Shipping | Shippo API | Real-time rates + label generation |
| Email | Resend | Transactional (orders, shipping notifications) |
| Image hosting | Supabase Storage (or Cloudinary if image processing needed) | |
| Search | Postgres `tsvector` initially | Algolia/Meilisearch only if needed |

Same stack as your Galaxy SF build, scaled up. Claude Code patterns transfer.

---

## Data Model (Supabase Schema)

### `products`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (pk) | |
| `slug` | text (unique) | URL-safe, e.g. `onan-131-0257-cooling-pump` |
| `sku` | text | OEM number or internal SKU |
| `title` | text | Customer-facing title |
| `description` | text | Markdown OK |
| `brand` | text | Onan, Kohler, Cummins, Jabsco, Westerbeke, Sherwood, etc. |
| `part_type` | text | "water pump", "burner", "control module" |
| `compatibility` | text[] | Series/models, e.g. `['DJB', 'MCCK']` |
| `condition` | enum | `new`, `used`, `rebuilt`, `nos` |
| `acquired_date` | timestamp | When parts came in (FIRST-CLASS) |
| `price_cents` | integer | |
| `weight_oz` | integer | For shipping rate calculation |
| `dimensions_in` | jsonb | `{length, width, height}` |
| `status` | enum | `available`, `sold`, `hidden`, `draft` |
| `sold_at` | timestamp | When sold (drives redirect logic) |
| `meta_title` | text | SEO title, 60 char max |
| `meta_description` | text | SEO meta, 160 char max |
| `tags` | text[] | For filtering and recommendations |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `product_images`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (pk) | |
| `product_id` | uuid (fk) | |
| `url` | text | Supabase Storage URL |
| `alt_text` | text | SEO-relevant |
| `sort_order` | integer | |

### `orders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (pk) | |
| `order_number` | text (unique) | Human-readable, e.g. EKY-1234 |
| `stripe_session_id` | text | |
| `customer_email` | text | |
| `customer_name` | text | |
| `shipping_address` | jsonb | |
| `status` | enum | `pending`, `paid`, `shipped`, `delivered`, `refunded` |
| `subtotal_cents` | integer | |
| `shipping_cents` | integer | |
| `tax_cents` | integer | |
| `total_cents` | integer | |
| `shipping_label_url` | text | From Shippo |
| `tracking_number` | text | |
| `carrier` | text | USPS, UPS, FedEx |
| `notes` | text | Internal notes |
| `created_at` | timestamp | |

### `order_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (pk) | |
| `order_id` | uuid (fk) | |
| `product_id` | uuid (fk) | Nullable (in case we delete) |
| `price_cents` | integer | Locked at sale time |
| `product_snapshot` | jsonb | Full product data at time of sale |

### `redirects` (for SEO preservation)

| Column | Type | Notes |
|--------|------|-------|
| `from_path` | text (unique) | Old URL |
| `to_path` | text | New URL |
| `status_code` | integer | 301 default |
| `reason` | text | `sold`, `migrated_from_shopify`, `manual` |
| `created_at` | timestamp | |

---

## The AI Upload Flow

The killer feature. 30 seconds from photo to live product page.

### User journey

1. Parent opens `/admin/upload` on phone (parts room, scale and tape measure on hand)
2. Taps **"+ New Part"**
3. Camera opens, takes 2-3 photos:
   - Front of part
   - Back of part
   - Close-up of nameplate or stamped numbers
4. Optional: 10-second voice note ("Onan DJB pump, pulled last week, runs but needs new gaskets")
5. Enters weight (oz) and box dimensions (l × w × h inches)
6. Taps **"Analyze"**
7. ~10 second loading screen ("Reading nameplate...", "Identifying part type...", "Generating description...")
8. Draft product appears with all fields filled:
   - Title (SEO-optimized)
   - Description
   - Brand, part type, compatibility list, condition, OEM number
   - Meta title + meta description
   - Suggested tags
9. Quick review (any field can be edited inline), set price
10. Tap **"Publish"** → live product page in 30 seconds total

### Technical flow

```
1. POST /api/products/extract
   - Multipart upload: 2-3 images + optional voice note + weight + dimensions
2. Server uploads images to Supabase Storage, returns URLs
3. (If voice note) Transcribe via OpenAI Whisper or similar
4. Build multimodal Claude API request:
   - System prompt: "You are an expert at identifying marine parts from photos..."
   - User content blocks: [image_1, image_2, image_3, transcribed_text, weight, dims]
   - Ask for structured JSON output
5. Call Claude API (claude-sonnet-4-5 or latest with vision)
6. Parse JSON response
7. Create product row with `status: draft`
8. Return draft product to admin UI
9. On Publish: PATCH /api/products/:id { status: 'available' }
10. Trigger sitemap regeneration + GMC feed update
```

### Extraction prompt (system)

```
You are an expert at identifying obsolete and discontinued marine parts from photos. Given images of a part (potentially including a nameplate, label, or part stamp), extract structured data.

Return ONLY a valid JSON object with these fields. If you cannot determine a field with confidence, return null for that field — do not guess.

{
  "brand": "Manufacturer name (Onan, Kohler, Cummins, Jabsco, Westerbeke, Sherwood, Sierra, etc.)",
  "oem_number": "Part number stamped on the part or label",
  "part_type": "Generic part type, lowercase (water pump, burner, control module, gasket, etc.)",
  "compatibility": ["Engine series or model numbers, as an array"],
  "condition": "One of: new, used, rebuilt, nos",
  "title": "SEO format: '[Brand] [OEM #] [Part Type] - [Condition] [Obsolete tag if applicable] | Ess-Kay Yards'",
  "description": "2-3 sentences describing the part, what it fits, condition notes, any visible wear or refurbishment. No inventory data.",
  "meta_description": "150 chars max, SEO-optimized",
  "tags": ["5-10 relevant tags including brand, part type, model compatibility"],
  "confidence_notes": "Anything uncertain or that the parent should confirm"
}
```

### Edge cases to handle in UI

- **Faded/greasy nameplate:** model returns null + confidence note. UI prompts parent to fill manually or re-photograph.
- **No visible label:** voice note becomes the source of truth.
- **Multiple possible matches:** model returns best guess + alternatives in `confidence_notes`.
- **Wrong extraction:** every field is editable inline before publish.
- **Parent doesn't trust the title:** show both AI-generated and a "manual entry" toggle.

---

## Storefront Templates

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Homepage: brand tiles, new arrivals, value prop |
| `/brands/[brand]` | Brand collection (Onan, Kohler, etc.) |
| `/parts/[category]` | Part type collection (pumps, burners, modules) |
| `/p/[slug]` | Product detail page |
| `/new-this-week` | Recently added inventory |
| `/sold/[slug]` | Sold product with redirect to similar |
| `/search` | Search results (or `/?q=...`) |
| `/cart` | Cart (client-side state, hydrated on load) |
| `/checkout` | Stripe Checkout redirect |
| `/orders/[id]` | Order confirmation |
| `/admin/*` | Admin (auth-gated, parents-only) |
| `/marina/*` | Marina services pages (dockage, repair, storage) |

### Product page essentials

- High-res image gallery (lazy-loaded)
- Title, brand, OEM #, condition, price
- "Acquired [Month Year]" badge
- Description
- Compatibility list (each model linked to brand-page filter)
- Add to cart button (or "Sold — see similar" if status is `sold`)
- Trust block: "Ships from Brewerton NY", "Family-owned since [year]", phone number
- Related parts: same brand, same part type
- JSON-LD: `Product` + `LocalBusiness` schema baked in by template

### Brand collection page essentials

- 200+ words of original SEO copy at top (covers what models/series, why hard to find, why Ess-Kay carries them)
- Sortable grid (newest, oldest, price)
- Faceted filters: condition, model series, in stock
- JSON-LD: `CollectionPage` + `LocalBusiness` schema

### Homepage essentials

- Headline emphasizing the obsolete-parts niche
- Brand tiles (Onan, Kohler, Cummins, Jabsco, Westerbeke, Sherwood)
- "New this week" carousel (the freshness angle for return shoppers)
- Trust signals: travelift photo, family-owned story, phone number prominent
- Marina services callout (cross-link to repair/dockage)

---

## Inventory Model: Salvage-Parts-Specific

The thing Shopify can't do well.

### Core principles

1. **Each item is unique by default.** No SKU/variant/quantity-to-restock thinking. One Onan DJB pump comes in, sells, gone.
2. **`acquired_date` is first-class data.** Customers want to see what's NEW.
3. **Sold doesn't mean disappear.** Old product pages with backlinks redirect to "similar parts" pages, preserving SEO authority.
4. **Stock notes leave the description.** They have their own fields and are surfaced cleanly in the UI.

### "Sold" state handling

When `status` flips from `available` to `sold`:
- Product page returns 301 redirect to `/brands/[brand]?recently_sold=[oem_number]`
- Brand page renders a banner: "We just sold our Onan 131-0257 cooling pump — here are similar Onan parts in stock."
- Backlinks from forums, repair guides, Reddit threads don't 404, they land on a relevant useful page
- Compounds SEO over time: every sold part becomes another redirect signal to the brand page

### "New this week" / "New this month"

- Homepage carousel
- Dedicated `/new-this-week` page (great SEO target for "new obsolete marine parts in stock")
- Optional weekly email newsletter to opted-in customers
- Sortable by `acquired_date` on every collection page

### Search behavior

- Full-text search across title, description, brand, OEM number, compatibility array
- Customer might type "Onan 131-0257", "DJB cooling pump", or "marine genset water pump", search hits on any
- Postgres `tsvector` is fine for V1 (10K products is well within range)
- Add Algolia later only if search performance becomes a real bottleneck

---

## Shipping: Shippo + Stripe Checkout

### At checkout

1. Cart contains items with weight + dimensions stored at upload
2. Customer enters shipping address in Stripe Checkout
3. Backend calculates total package weight (sum of items) and pickslargest box dimensions (assume single box for V1)
4. Backend calls Shippo `rates` endpoint: origin (Brewerton NY) + destination + parcel
5. Shippo returns USPS Priority, UPS Ground, FedEx rates
6. Display rates in checkout, customer picks
7. Stripe Checkout completes payment

### After purchase

1. Stripe webhook fires `checkout.session.completed`
2. Backend creates order, marks product as `sold`
3. Email parents: "New order EKY-1234. Onan 131-0257 to John Smith, FL. $145 + $18 shipping."
4. In `/admin/orders`, parents tap **Print Label**
5. Backend calls Shippo `transactions` endpoint with the rate ID
6. Shippo returns label PDF + tracking number
7. Backend updates order with tracking
8. Email customer: "Your order has shipped. Tracking: 9400..."

### MVP shortcut if needed

If shipping integration would delay launch, fall back to:
- Flat-rate or weight-band shipping at checkout (e.g., $12 under 5lb, $22 5-15lb, $35 over 15lb, "contact for over 30lb")
- Manual label printing via Pirate Ship (free, no API)
- Manual tracking entry in admin form
- Email customer when tracking number is entered

This is fine for low-medium volume. Add Shippo API later when it's clearly worth the integration time.

### Cost estimate

- Shippo: ~$10/mo plus a small per-label fee (verify at signup)
- Stripe: 2.9% + $0.30 per transaction
- Total transaction overhead: similar to or better than Shopify Payments

---

## Migration Plan

### Pre-migration prep

1. **Export from Shopify**
   - Products CSV (titles, descriptions, prices, images, tags)
   - Customer CSV (for any account migration)
   - Order history (for records)
   - Image URLs — download all and re-upload to Supabase Storage

2. **Build URL mapping spreadsheet**
   - Column A: every old Shopify URL (products, collections, pages, blog)
   - Column B: corresponding new URL
   - Becomes the seed data for the `redirects` table
   - Tools to generate the list: `https://www.ess-kayyards.com/sitemap.xml` and Shopify CSV export

3. **Stage the new site**
   - Deploy to staging URL (e.g., `staging.ess-kayyards.com`)
   - Import all data, verify products render correctly
   - Run on staging for 1-2 weeks; have your parents test the admin and place test orders

### Cutover day

1. Switch DNS to point at Vercel (low TTL the day before to make this fast)
2. Deploy 301 redirects for every mapped URL
3. Submit new sitemap in GSC
4. Update Google Business Profile website URL
5. Update Merchant Center feed source

### First-month monitoring

- Daily GSC checks: indexed pages count, crawl errors, coverage report
- Daily order volume: did we drop?
- 404 monitoring (set up Sentry or simple log alerting)
- Core Web Vitals via PageSpeed Insights

---

## Phased Build Plan

### Phase 0 (Tomorrow): Half-Day SEO triage
See separate doc. Stop the bleeding on Shopify.

### Phase 1 (Weeks 1-3): Foundation
- Next.js + Supabase + Vercel project setup
- Auth (Supabase magic link for parents only)
- Database schema deployed
- Admin shell with placeholder pages
- Basic product CRUD (manual entry path)
- Stripe Checkout integration
- Single product detail page rendering

### Phase 2 (Weeks 4-7): The AI upload tool
- Image upload to Supabase Storage
- Claude API integration (vision)
- Extraction prompt + parser
- Draft product UI with inline editing
- Publish flow
- Tested by your parents adding 5-10 real new products

### Phase 3 (Weeks 8-10): Storefront
- Homepage
- Brand collection pages with SEO copy
- Product page polish (gallery, related parts, schema)
- Search
- Sold-state redirect logic
- "New this week" feed
- LocalBusiness + Product JSON-LD baked into templates

### Phase 4 (Weeks 11-13): Migration + launch
- Shopify export → Supabase import
- URL mapping
- 301 redirects deployment
- Shippo integration
- Customer order email flow (Resend)
- Staging tests with real parents-as-users
- Cutover day

### Phase 5 (Month 4+): Polish + portfolio
- Iterate based on real usage data
- Capture metrics (entry time, organic traffic, conversion, cost savings)
- Write the case study
- Document for portfolio

---

## Open questions to resolve with your parents

- Founding year of the marina (for trust copy and "since 19XX" language)
- Top 10 SKUs by sales volume or margin (those get optimized first)
- Real contact email — `EssKayYardsStore@GMail.com` or `info@ess-kayyards.com`?
- Any existing customer accounts they want migrated?
- Domain DNS access — who controls it?
- Old hosting account access (for killing the ghost HTML site)
- Are they OK with a 1-2 day cutover window with potential brief disruption?
- Approximate annual order volume (informs whether we need Shippo API or can launch with manual labels)

---

## What this becomes for your portfolio

Once shipped, this is a case study with:
- **Real client, real revenue:** family business, real money on the line
- **Real metrics:** before/after on entry time, organic traffic, conversion rate, cost savings
- **AI-native product design:** Claude vision integrated into a product creation flow that genuinely changes how the business operates
- **Owned every layer:** discovery, design, engineering, deployment
- **Portfolio narrative:** "I designed and shipped a custom AI-powered e-commerce platform that cut product entry from 10 minutes to 30 seconds, drove [X]% growth in organic search traffic, and saved $[Y]/year in platform costs for a salvage marine parts business."

That's the kind of case study that wins senior IC product design interviews in 2026.
