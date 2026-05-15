# Ess-Kay Yards: Half-Day SEO Triage

Goal: stop the bleeding on the current Shopify site with the minimum work that's 100% portable to the future custom platform. Total time: 4-5 hours.

---

## Time budget

| # | Task | Time | Carries over to custom? |
|---|------|------|-------------------------|
| 1 | Homepage title + meta | 15 min | Yes (paste into new templates) |
| 2 | GSC verify + sitemap | 15 min | Yes (lives on Google forever) |
| 3 | Google Business Profile | 45 min | Yes (lives on Google forever) |
| 4 | Google Merchant Center | 60 min | Yes (re-source feed at migration) |
| 5 | Kill ghost HTML site | 45 min | Yes (one-time fix) |
| 6 | Top 20 SKU title + meta | 60-90 min | Yes (paste into custom DB) |

---

## 1. Homepage Title + Meta

**Path:** Shopify Admin → Online Store → Preferences

**Title (60 chars):**
```
Obsolete Marine Parts | Onan, Kohler, Jabsco | Ess-Kay Yards
```

**Meta description (~145 chars):**
```
Hard-to-find obsolete marine parts for Onan, Kohler, Cummins, and Jabsco engines. Family-run marina in Brewerton, NY shipping nationwide.
```

Save. Done. This single change can move impressions within a week of recrawl.

---

## 2. Google Search Console

1. Go to https://search.google.com/search-console
2. Add property → choose **Domain** type (covers all subdomains and protocols)
3. Verify via DNS TXT record (you'll need access to the domain registrar)
4. Once verified: Sitemaps → submit `https://www.ess-kayyards.com/sitemap.xml`
5. Screenshot the **Performance** tab. This is your baseline for measuring everything else.

---

## 3. Google Business Profile

Claim/optimize at https://business.google.com.

Fields to fill:

- **Name:** Ess-Kay Yards Marina
- **Categories:** Marina (primary), Boat Repair Shop, Boat Storage Facility, Marine Supply Store
- **Address:** 5307 Guy Young Road, Brewerton, NY 13029
- **Phone:** 315-676-2711
- **Website:** https://www.ess-kayyards.com (update after migration)
- **Hours:** 9 AM - 7:30 PM, 7 days
- **Description:** Mention "obsolete marine parts" plus brand names (Onan, Kohler, Cummins, Jabsco) in the first 100 chars
- **Photos:** Upload 10+: marina exterior, travelift, parts inventory shelves, your team, boats in for repair, the gas dock

Local SEO bump from this alone is often noticeable within 2 weeks.

---

## 4. Google Merchant Center (single biggest lever for product orders)

1. Set up account at https://merchants.google.com
2. In Shopify Admin: Apps → install **Google & YouTube** channel (free)
3. Connect Shopify → GMC. Product feed auto-syncs.
4. Enable free product listings (Surfaces across Google).
5. Skip paid Shopping ads for now.

This puts products in the Shopping tab AND main search results alongside Amazon. For obsolete parts where competition is essentially zero, this is the highest-leverage lever in the whole half-day.

---

## 5. Kill the Ghost HTML Site

The URL `http://www.ess-kayyards.com/catalog/nauticalbrassware.html` is a pre-Shopify static page still indexed by Google. Splits domain authority and confuses crawlers.

Steps:
1. Ask your parents who built the original pre-Shopify site. Possibilities: GoDaddy, Bluehost, HostGator, an old web designer.
2. Get into that hosting account.
3. Either delete the `/catalog/` folder, or set up a server-level 301 redirect from `/catalog/*` to the homepage.
4. Once dead, request removal in GSC → Removals → New Request.

If the hosting is genuinely lost, you may need to add a `/catalog/*` redirect rule at your DNS or CDN level instead. Worst case it's a Cloudflare page rule.

---

## 6. Top 20 SKU Title + Meta Fixes

Pull the top 20 SKUs by sales volume or margin from Shopify Admin → Analytics → Reports → Sales by product. For each, apply this transformation.

### Title formula

**Old (typical):**
```
131-0257 Onan Engine Cooling Water Pump OBSOLETE Refurbished, includes Pulley 512-0166 and Mounting Bracket 3/5/2024 THIS PART IS IN STOCK 3/5/2024
```

**New:**
```
Onan 131-0257 Cooling Water Pump - Refurbished Obsolete | Ess-Kay Yards
```

**Pattern:** `[Brand] [OEM #] [Part Type] - [Condition] [Obsolete tag] | Ess-Kay Yards`

### Meta description formula

```
Refurbished Onan 131-0257 cooling water pump for marine genset. Includes pulley 512-0166 and mounting bracket. Ships from Ess-Kay Yards Marina, Brewerton NY.
```

**Pattern:** `[Condition] [Brand] [OEM #] [Part Type] for [Application]. [Includes notes]. Ships from Ess-Kay Yards Marina, Brewerton NY.`

### IMPORTANT: strip inventory text from descriptions

Current descriptions have things like:
- `1 Remaining 10/31/2024`
- `THIS PART IS IN STOCK 3/5/2024`
- `OBSOLETE 10/31/2024`

Move that information OUT of the description. The custom platform will track this properly. Leaving it in dilutes the keywords Google actually cares about.

### Three worked examples to use directly

**Example 1: Onan 131-0257 Pump**
- Old: `131-0257 Onan Engine Cooling Water Pump OBSOLETE Refurbished...`
- New title: `Onan 131-0257 Cooling Water Pump - Refurbished Obsolete | Ess-Kay Yards`
- New meta: `Refurbished Onan 131-0257 cooling water pump for marine genset. Includes pulley 512-0166 and mounting bracket. Ships nationwide from Brewerton NY.`

**Example 2: Homestrand Kenyon Burners**
- Old: `Homestrand Kenyon [USED] Rebuilt Burners with Cap For model 126, 205, 206 & 209 stoves OBSOLETE...`
- New title: `Homestrand Kenyon Rebuilt Burners for 126, 205, 206, 209 Stoves | Ess-Kay Yards`
- New meta: `Used and rebuilt Homestrand Kenyon stove burners with cap, fits models 126, 205, 206, 209. Hard-to-find obsolete parts. Ships from Ess-Kay Yards Marina.`

**Example 3 template (any brand):**
- New title: `[Brand] [OEM] [Part] - [Condition] | Ess-Kay Yards`
- New meta: `[Condition] [Brand] [OEM] [Part] for [marine engine/genset/series]. [Useful detail]. Ships from Ess-Kay Yards Marina, Brewerton NY.`

---

## After this half-day

Walk away from Shopify SEO. The remaining lift goes into the custom platform.

Within 1-2 weeks of these changes you should see early Search Console signals:
- Rising impressions on brand-name + obsolete queries
- First organic clicks on the brand-name pages
- Possibly first Merchant Center product impressions

Use that data to validate the obsolete niche thesis before committing the full 3-month build. If you see real signal in 2-3 weeks, the migration ROI is confirmed.
