# Ecommerce-Store — Gym Niche

Single-store gym ecommerce: supplements, apparel, equipment, programs. Storefront with **switchable themes**, admin dashboard with role-based staff, and a **CheckoutChamp-style funnel engine** for upsells, downsells, and order bumps.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind**
- **Supabase** — Postgres, Auth, RLS
- **Stripe** (international) + **JazzCash / EasyPaisa** (Pakistan)
- **Zod** for shared client/server validation
- **react-hook-form** for client forms

## Getting started

```bash
cp .env.example .env.local        # fill in Supabase + Stripe keys
npm install
supabase start                    # requires the supabase CLI
supabase migration up
npm run dev
```

Open http://localhost:3000.

To make yourself admin after first signup:

```sql
-- in Supabase SQL editor
insert into staff (user_id, role_id, status)
select p.id, r.id, 'active'
  from profiles p, roles r
 where p.email = 'you@example.com' and r.key = 'admin';
```

## Theme system

Five built-in themes (`classic`, `powerhouse`, `iron`, `pulse`, `minimal`), switchable from `/admin/themes`. Each theme defines:

- HSL color tokens (background, foreground, primary, accent, etc.)
- Light/dark surface
- Display flavor (uppercase headings, letter spacing, border radius)

The active theme id lives in `store_settings.active_theme`. The storefront layout reads it server-side and emits CSS variables inline scoped to `[data-theme="..."]` — no client JS, no flash. The admin can also override the **primary brand color** with a custom hex value while keeping the rest of the theme.

Adding a theme: append to `THEMES` in [src/lib/themes/registry.ts](src/lib/themes/registry.ts). The picker UI updates automatically.

## Architecture cheat sheet

| Concern | Where it lives |
|---|---|
| Env validation (incl. `STORE_NAME`) | [src/config/env.ts](src/config/env.ts) |
| Permission catalog + default roles | [src/config/permissions.ts](src/config/permissions.ts) |
| Singleton store settings + read | [src/lib/store/settings.ts](src/lib/store/settings.ts) |
| Per-request auth + staff context | [src/lib/store/context.ts](src/lib/store/context.ts) |
| RBAC checks | [src/lib/rbac/check.ts](src/lib/rbac/check.ts) |
| Theme registry + apply | [src/lib/themes/](src/lib/themes/) |
| Payment provider interface | [src/lib/payments/provider.ts](src/lib/payments/provider.ts) |
| Funnel engine | [src/lib/funnel/engine.ts](src/lib/funnel/engine.ts) |
| Validation schemas (Zod) | [src/lib/validation/](src/lib/validation/) |
| SEO helpers + JSON-LD | [src/lib/seo/](src/lib/seo/) |
| Server Actions | [src/server/actions/](src/server/actions/) |
| Supabase migrations | [supabase/migrations/](supabase/migrations/) |

## Catalog model (gym-flavored)

`products.kind` is an enum: `supplement | apparel | equipment | accessory | program | membership`. Kind-specific fields live in `products.attributes jsonb`:

- **supplement** — `{ servings, serving_size_g, calories, protein_g, carbs_g, fat_g, ingredients[] }`
- **apparel** — `{ gender, fit, sizes[], material }`
- **equipment** — `{ weight_kg, dimensions_cm, material }`
- **program** — `{ duration_weeks, level, format, download_url }`
- **membership** — `{ duration_days, perks[] }`

Every product has variants (flavor/size combos), media, categories, and reviews (moderated).

## Roles

System roles seeded for every install (read-only):

- **Admin** — full access
- **Store Manager** — catalog, orders, customers (no team/settings)
- **Customer Support** — read orders/customers, process refunds
- **Content Editor** — edit products + funnels (no publish)
- **Analyst** — read-only analytics + exports

Staff with `roles.manage` can clone any system role and create custom permission bundles.

## Funnel engine

A funnel is a directed graph of **steps** (`landing → checkout → upsell → downsell → thank_you`). Each step branches via `on_accept_step_id` / `on_decline_step_id`. A `funnel_session` tracks one customer's path; `context jsonb` is the **pipe** that carries data forward (cart, attribution, custom fields).

Saved Stripe payment methods enable one-click upsells (off-session charging on the saved card).

## Rendering strategy

| Surface | Mode |
|---|---|
| `(storefront)/page.tsx`, `/products`, `/product/[slug]`, collections | ISR (`revalidate = 60`) |
| `cart`, `/checkout`, `/funnel/[funnelId]/[step]` | `force-dynamic` |
| `/account`, `/admin/*` | `force-dynamic` |

Admin theme/branding changes call `revalidatePath("/", "layout")` so customers see updates immediately.

## SEO baseline

- `app/layout.tsx` reads `store_settings` for site title, OG, locale.
- Per-page metadata via `buildMetadata()` helper.
- JSON-LD builders for Product, Breadcrumb, Organization.
- `app/sitemap.ts` + `app/robots.ts` ready to extend with DB-backed product URLs.

## Roadmap

1. Foundation ✅
2. Auth (email/password, magic link, Google, password reset) ✅
3. Theme system with admin picker ✅
4. Branding admin form ✅
5. Catalog admin CRUD (products, variants, categories, media) — next
6. Storefront hooked up to DB (PLP, PDP, search, filters)
7. Cart + checkout + Stripe end-to-end
8. JazzCash + EasyPaisa flows
9. Order admin (fulfillment, refunds)
10. Funnel builder UI + runtime
11. Reviews moderation
12. Analytics
# suppway
