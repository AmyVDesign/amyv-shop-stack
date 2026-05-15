# Security Policy

Security architecture, controls, and operational practices for the Ess-Kay Yards and Galaxy SF e-commerce platforms.

---

## Threat model

Realistic threats for a small e-commerce site on this stack:

- Bots scraping product data
- Brute-force attempts on order tracking lookups
- Phishing attempts targeting admin accounts
- Vulnerable npm dependencies introducing CVEs
- Accidentally committing API keys to git

The big nightmares (payment data theft, database takeover, ransomware) are mitigated by stack architecture, not application code.

---

## Stack security responsibility

Handled by platforms:

- **Stripe** — payment processing, PCI DSS compliance, card data storage. Our servers never see card numbers.
- **Vercel** — TLS provisioning, DDoS mitigation, edge WAF, infrastructure patching.
- **Supabase** — auth flows, password hashing, JWT signing, parameterized SQL via the SDK, infrastructure patching.

Owned by us:

- Application logic (input validation, authorization checks)
- Configuration (env vars, RLS policies, webhook secrets)
- Operations (monitoring, response, backups)

---

## Authentication

### Customer auth

- Email-based, passwordless via Supabase Auth magic link
- Optional account creation (account is not required to purchase)
- Session lifetime: 30 days, sliding
- Email verification required before any past guest orders auto-link

### Admin auth

- Same magic link flow as customers
- **2FA required** (TOTP, set up at first login)
- Session lifetime: 7 days, hard expiration
- IP logging on every admin login
- Email notification on new-IP login

---

## Authorization (Supabase RLS)

Every table has Row Level Security policies enforced at the database layer:

| Table | Anonymous | Customer | Admin |
|-------|-----------|----------|-------|
| `products` (status='available') | Read | Read | Read/Write |
| `products` (other status) | — | — | Read/Write |
| `product_images` | Read | Read | Read/Write |
| `orders` | — | Read own only | Read/Write |
| `order_items` | — | Read via order join | Read/Write |
| `redirects` | Read | Read | Read/Write |

All admin writes require `auth.role() = 'admin'` (set via Supabase user metadata).

---

## Input validation

- Server-side validation on every form and API endpoint using `zod`
- Product descriptions stored and rendered as **Markdown**, never raw HTML, to prevent XSS via product copy
- File uploads validated by MIME type AND magic bytes (not just extension)
- File size limits: 10MB per image, 50MB per upload session

---

## Secrets management

- All secrets in Vercel env vars, never committed to git
- `.env.local` and `.env*` listed in `.gitignore`
- GitHub secret scanning enabled
- Pre-commit hook with `gitleaks` for local scanning
- Rotated quarterly:
  - Stripe API keys (publishable + secret)
  - Shippo API token
  - Anthropic API key
  - Supabase service role key
  - Resend API key

---

## Webhook signature verification

All incoming webhooks verify signatures before processing:

- **Stripe**: `stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET)`
- **Shippo**: HMAC-SHA256 of request body with shared secret

Failed verification returns 401 immediately. Never trust unverified webhook payloads.

---

## Rate limiting

| Surface | Limit |
|---------|-------|
| Login (per email) | 5 per minute (Supabase built-in) |
| Order tracking lookup (per IP) | 10 per minute |
| API routes (per IP) | 100 per minute (Vercel middleware) |
| Admin uploads (per session) | 30 per minute |

---

## Logging and monitoring

- Vercel request logs: 30-day retention
- Sentry for application errors (no PII in error context)
- Supabase auth logs reviewed weekly for unusual patterns
- New-IP admin login alerts to admin email

---

## Backup and recovery

- Supabase Pro: daily backups, 7-day retention, point-in-time recovery
- Storage bucket: versioning enabled, 30-day soft delete
- Weekly database export to encrypted off-platform storage (cold backup)

---

## Dependency security

- Dependabot alerts enabled on the repo
- Monthly review: `pnpm audit`
- Major dependency updates reviewed and tested before merge
- Lockfile (`pnpm-lock.yaml`) committed; no transitive auto-updates

---

## Incident response

If something looks wrong:

1. Pause Stripe webhooks via Stripe Dashboard (immediate isolation)
2. Rotate all API keys via Vercel env panel
3. Check Supabase auth logs for unauthorized access
4. If data integrity compromised: restore from latest known-good backup
5. Notify affected customers within 72 hours if order data or PII was accessed

---

## Pre-deploy checklist

Before merging to `main`:

- [ ] No secrets in commit history (`gitleaks` clean)
- [ ] All API routes have auth middleware
- [ ] All forms use server-side `zod` validation
- [ ] RLS policies pass the test suite
- [ ] All webhook handlers verify signatures
- [ ] No raw HTML rendering of user-supplied content
- [ ] Dependencies up to date (`pnpm audit` clean)

---

## Contact

Security questions or reports: [admin email]
