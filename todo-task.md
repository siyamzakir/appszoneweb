# Nicktio — Software & Hosting Company · Task Board

---

## ✅ COMPLETED

| # | Task | Notes |
|---|------|-------|
| 1 | Upgrade Next.js 15 → 16.1.6 | All packages updated, lockfile regenerated |
| 2 | Full TypeScript migration | `route.js` → `route.ts`, `next.config.mjs` → `next.config.ts` |
| 3 | Replace DM Sans → IBM Plex Sans | Updated `layout.tsx` + docs component |
| 4 | SQLite database setup (Drizzle ORM → **Prisma ORM**) | Migrated to Prisma: schema, seed, all 4 API routes rewritten |
| 5 | Real user registration API | `POST /api/register` — bcrypt-hashed, validates duplicates |
| 6 | NextAuth wired to database | Credentials, Google OAuth, GitHub OAuth — all use DB now |
| 7 | Stripe checkout API | `POST /api/stripe/checkout` — creates subscription session |
| 8 | Stripe webhook handler | `POST /api/stripe/webhook` — handles paid/failed/canceled events |
| 9 | `.env.example` documented | All required keys listed with instructions |

---

## 🔲 TODO — NEXT TASKS

### PHASE 1 · Environment & Secrets (Do This First)
- [ ] **Fill `.env` file** — copy from `.env.example` and add real keys:
  - `NEXTAUTH_SECRET` → run: `openssl rand -base64 32`
  - `NEXTAUTH_URL` → e.g. `http://localhost:3000`
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` → [console.cloud.google.com](https://console.cloud.google.com)
  - `GITHUB_ID` / `GITHUB_SECRET` → [github.com/settings/apps](https://github.com/settings/apps)
  - `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` → [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
  - `STRIPE_WEBHOOK_SECRET` → run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  - Stripe Price IDs for Pro Monthly/Annual and Business Monthly/Annual

---

### PHASE 2 · Content Rewrite (Software & Hosting Company)
- [ ] **Update site identity** — company name, logo, tagline in `Header` and `Footer`
- [ ] **Rewrite Hero section** — hosting/software company messaging, CTA buttons → "View Plans" / "Get Started"
- [ ] **Rewrite Pricing section** — rename plans (Starter / Pro / Business), update features list to reflect hosting services (SSD storage, SSL, bandwidth, domains, backups, CDN)
- [ ] **Rewrite Services section** — Web Hosting, Cloud VPS, Domain Registration, Managed WordPress, SSL Certificates, Email Hosting
- [ ] **Update Features/Benefits section** — 99.9% uptime, 24/7 support, free migration, instant setup
- [ ] **Rewrite Footer** — update links, company info, social links

---

### PHASE 3 · Stripe Payment UI
- [ ] **Add "Subscribe" button to pricing cards** — calls `POST /api/stripe/checkout` with plan slug + billing interval
- [ ] **Add billing interval toggle** — Monthly / Annual on pricing page (already has UI, needs API hookup)
- [ ] **Create `/dashboard` page** — show active subscription, plan name, renewal date, payment history
- [ ] **Create `/dashboard/billing` page** — cancel subscription, upgrade/downgrade plan, download invoices

---

### PHASE 4 · Auth UI Polish
- [ ] **Fix Sign Up flow** — currently calls `/api/register` correctly, but redirects to `/signin` page (page doesn't exist as route, needs creating)
- [ ] **Create `/signin` page** — dedicated page using existing `SignIn` component
- [ ] **Create `/signup` page** — dedicated page using existing `SignUp` component
- [ ] **Add "Forgot Password" flow** — email-based reset (needs email provider: Resend / Nodemailer)
- [ ] **Add email verification** — send verification email on register

---

### PHASE 5 · Admin Panel
- [ ] **Create `/admin` route group** — protected by `role === "admin"` middleware
- [ ] **Admin dashboard** — total users, active subscriptions, MRR (monthly recurring revenue), recent payments
- [ ] **User management table** — list users, change role, view subscription
- [ ] **Plan management** — edit plan features, toggle active/inactive

---

### PHASE 6 · Blog & SEO
- [ ] **Convert blog to real CMS** — currently uses markdown files; optionally connect to a headless CMS (Contentful / Sanity) or keep markdown
- [ ] **Add SEO metadata** — per-page `<title>`, `description`, Open Graph, structured data for hosting business
- [ ] **Sitemap & robots.txt** — add Next.js `sitemap.ts` and `robots.ts`

---

### PHASE 7 · Production Readiness
- [ ] **Add `.gitignore` entry** for `prisma/appszone.db`, `.env`, and `prisma/migrations/`
- [ ] **PostgreSQL/MySQL migration** — when ready: change `provider` in `prisma/schema.prisma`, update `DATABASE_URL`, run `prisma migrate deploy`
- [ ] **Deploy to Vercel / Railway / VPS** — configure production env vars
- [ ] **Set up Stripe production keys** — switch from `sk_test_` to `sk_live_`
- [ ] **Set up webhook in Stripe Dashboard** for production URL

---

## 📁 Key File Reference

| File | Purpose |
|------|---------|
| `package/prisma/schema.prisma` | **Prisma schema** — all 5 DB models (source of truth) |
| `package/prisma/seed.ts` | Seed default hosting plans (`pnpm db:seed`) |
| `package/src/lib/db.ts` | Prisma client singleton (used in all API routes) |
| `package/src/lib/schema.ts` | Re-exports Prisma-generated types |
| `package/src/lib/stripe.ts` | Stripe client + plan price ID config |
| `package/src/app/api/register/route.ts` | User registration endpoint |
| `package/src/app/api/auth/[...nextauth]/route.ts` | NextAuth config (DB-backed) |
| `package/src/app/api/stripe/checkout/route.ts` | Create Stripe checkout session |
| `package/src/app/api/stripe/webhook/route.ts` | Handle Stripe webhook events |
| `package/.env.example` | All required environment variables |
| `package/prisma/appszone.db` | SQLite database file (auto-created by Prisma, lives next to schema) |

---

## 🗄️ Database Tables

| Table | Columns |
|-------|---------|
| `users` | id, name, email, username, password (bcrypt), role, stripe_customer_id |
| `plans` | id, name, slug, monthly_price, annual_price, stripe_price_id_*, features |
| `subscriptions` | id, user_id, plan_id, stripe_subscription_id, status, billing_interval |
| `payments` | id, user_id, subscription_id, stripe_invoice_id, amount, status |
| `accounts` | id, user_id, provider, provider_account_id (OAuth accounts) |

> **Seeded plans:** Starter ($0), Pro ($9/mo · $90/yr), Business ($29/mo · $290/yr)

---

## 🔐 Auth Credentials

| Method | Details |
|--------|---------|
| Credentials | Email or username + password (bcrypt, 12 rounds) |
| Google OAuth | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` required |
| GitHub OAuth | `GITHUB_ID` + `GITHUB_SECRET` required |

> Old hardcoded `admin / admin123` is removed. All users register via `/api/register`.

---

## 💳 Payment Flow (Stripe)

1. User clicks "Subscreibe" on pricing pag
2. Frontend calls `POST /api/stripe/checkout` with `{ planSlug, billingInterval }`
3. API creates Stripe Checkout session → returns `{ url }`
4. User is redirected to Stripe hosted checkout (14-day free trial)
5. On success → redirected to `/dashboard?success=true`
6. Stripe fires webhook → `POST /api/stripe/webhook` → subscription + payment saved to DB

---

## 🛠️ Useful Commands

```bash
# From project root (nicktio-nextjs-pro-v1-1/):
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm type-check   # TypeScript check

# From package/ directory (Prisma ORM + SQLite):
pnpm db:generate  # Regenerate Prisma client after schema changes
pnpm db:migrate   # Create + apply migration (prompts for migration name)
pnpm db:push      # Push schema changes without migration history (dev shortcut)
pnpm db:seed      # Seed default hosting plans
pnpm db:studio    # Open Prisma Studio (visual DB browser)
pnpm db:reset     # Drop & recreate DB + re-run all migrations + seed

# First-time setup (from package/ directory):
# 1. pnpm install
# 2. pnpm db:migrate   (name it: init)
# 3. pnpm db:seed

# Stripe local testing:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
