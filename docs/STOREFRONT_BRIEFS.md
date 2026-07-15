# Storefront Design Briefs

Design decisions for the esskay storefront, grounded in a review of the current
Shopify store. Sections cover the product detail page and the checkout shipping
step. Both phases build on the cart and checkout session work already shipped.

---

## Product Detail Page

### Keep from Shopify

**Photo gallery with thumbnails.** The existing photography is strong. The gallery
carries over as-is: large primary image, thumbnail strip below, click to switch
the active photo. No lightbox needed for v1.

**Quantity stepper next to Add to cart.** Already implemented in the cart phase.
The stepper on the product page is the right place to set quantity before adding.

**Buy Now fast path.** A "Buy Now" button skips the cart entirely: it calls
`/api/checkout` with the current product and quantity, then redirects straight to
Stripe. Useful for single-item purchases, which are the common case for
obsolete-parts buyers.

**SKU and part number, prominent.** Buyers search by part number before they
search by description. Both the SKU (our internal identifier) and the OEM part
number get their own labeled rows near the top of the detail column, rendered in
monospace.

**Vendor and category rows.** Structured metadata below the part numbers: vendor
name (manufacturer) and category label, each as a labeled row. Gives buyers the
context they need to confirm compatibility.

### Remove (apparel-theme boilerplate, wrong for a parts store)

- **Size guide.** Not applicable.
- **Wishlist / save for later.** Replaced by the notify-me form (see below).
- **Customer review section.** Parts buyers trust specs and photos, not star
  ratings. Reviews add complexity and almost no value for an inventory-style
  catalog. Remove entirely.

### Replace

**Stock status in product titles.** The Shopify store types availability directly
into the title field ("THIS PART IS IN STOCK 3/19/2026"). That approach makes
every title stale the moment inventory changes and pollutes search results and
Google Shopping feeds.

Replace with: a live "In stock" badge driven by `qty_for_sale > 0`. The badge
is always accurate by construction. Titles are never modified for availability.
When `qty_for_sale === 0`, the badge reads "Out of stock" and the Add to cart
button becomes the notify-me form (below).

**Wishlist becomes "Tell me when you find one."** For out-of-stock parts,
surfacing a notify-me form where the Add to cart button normally lives serves a
real business need: Ess-Kay regularly sources obsolete parts on request, and
email capture is how those leads arrive.

Implementation notes:
- Form: email field + optional note ("looking for the 1963 model").
- Writes a row to `parts_watch_list` (table to be designed) with
  `product_id`, `email`, `note`, `created_at`.
- No auth required; guests can submit.
- Admin view shows open watch-list entries per product, count displayed on the
  inventory detail page.
- Email notification to the buyer is Phase 2 (requires transactional email
  setup). Phase 1 just captures the lead.

---

## Checkout Shipping Step

Reference: Shopify's single-page checkout with the order summary rail on the
right. That layout works well; the main improvements are the pickup option,
shipping method reveal timing, a pre-checkout zip estimate, and owner-editable
rate tables.

### Ship / Pickup toggle

At the top of the delivery section, a prominent two-option toggle: "Ship" and
"Pick up at the marina." Local pickup is free and should be presented as the
first, default option since the majority of buyers are regional (Oneida Lake,
Erie Canal corridor).

Selecting pickup collapses the address form and shows the marina address and
hours. Selecting Ship expands the address form.

### Shipping method reveal

Shipping method options stay locked (shown as a placeholder row with a lock
icon) until the buyer has entered a complete delivery address. Once an address
is present, the rate table resolves and method options appear with prices. The
summary rail updates immediately when a method is selected.

Rationale: showing placeholder "$--" rates before an address is entered causes
confusion and creates a false impression that rates are unavailable.

### Zip-code estimate in the cart (improvement over Shopify)

Before the buyer begins checkout, the `/cart` page offers an optional zip-code
shipping estimate widget. The buyer types a zip code, the estimate looks up the
matching rate zone, and shows the shipping cost for each available method. No
address required; the estimate is advisory, not binding.

This is a meaningful improvement over the Shopify flow, which shows no shipping
cost until well into checkout. Marina customers often check shipping cost before
committing to add-to-cart.

### Rate structure

**Zone-based, weight-based rates, owner-editable.** Shipping zones (defined by
zip-code prefix ranges) map to a table of method + weight-range + price rows.
The marina owner can edit rates in the admin panel without a developer. No
per-quote carrier API dependency at launch.

Schema sketch (to be finalized in migration):
- `shipping_zones`: zone name, zip prefix patterns.
- `shipping_rates`: zone, method label ("Ground", "Priority", "Freight"),
  weight range (min_oz, max_oz), price_cents.
- Products gain a `weight_oz` column. A backfill pass sets reasonable defaults;
  owner reviews and corrects per product.

**Carrier-calculated rates** (UPS, FedEx live quotes) as a later upgrade. The
zone/weight table is the fallback and the long-term path for simplicity; live
quotes add complexity and API cost that is not justified until volume warrants it.

### Summary rail

Persists on the right side through all checkout steps (delivery, payment). Shows
the line items with quantities, the selected shipping method and cost, and the
running total. Updates in place when the shipping method changes. On mobile,
collapses to an accordion above the step form.

---

## Open questions (resolve before building)

1. **Buy Now and holds.** "Buy Now" creates a claim and immediately opens Stripe.
   If the buyer abandons, the hold expires after 30 minutes (Phase 2 webhook).
   Confirm the 30-minute window is acceptable before building the button.

2. **parts_watch_list deduplication.** Should a second submission for the same
   email + product overwrite, update `updated_at`, or create a second row? Lean
   toward upsert on (email, product_id).

3. **Pickup address and hours.** Confirm the marina address and seasonal hours
   copy before building the pickup confirmation UI.

4. **Weight backfill scope.** How many products need weight_oz before the
   shipping estimate widget is useful? If fewer than 20 products are in the
   catalog at launch, manual entry per product is acceptable.
