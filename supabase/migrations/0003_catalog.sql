-- =============================================================================
-- 0003_catalog.sql
-- Gym-flavored catalog: categories, products with `kind` (supplement, apparel,
-- equipment, accessory, program, membership), variants, media, reviews.
-- =============================================================================

create type product_kind as enum ('supplement','apparel','equipment','accessory','program','membership');

create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  title       text not null,
  description text,
  image_url   text,
  parent_id   uuid references public.categories(id) on delete set null,
  sort_order  integer not null default 0,
  is_published boolean not null default true,
  seo_title       text,
  seo_description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_categories_updated before update on public.categories for each row execute function public.set_updated_at();

create table public.products (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  title         text not null,
  description   text,
  body_html     text,
  kind          product_kind not null default 'supplement',
  status        text not null default 'draft' check (status in ('draft','published','archived')),
  brand         text,
  tags          text[] not null default '{}',

  -- Kind-specific structured data:
  --   supplement: { servings, serving_size_g, calories, protein_g, carbs_g, fat_g, ingredients[] }
  --   apparel   : { gender, fit, sizes[], material }
  --   equipment : { weight_kg, dimensions_cm, material }
  --   program   : { duration_weeks, level, format ('pdf'|'video'|'app'), download_url }
  --   membership: { duration_days, perks[] }
  attributes    jsonb not null default '{}'::jsonb,

  seo_title       text,
  seo_description text,
  rating_avg    numeric(3,2),
  rating_count  integer not null default 0,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_products_status     on public.products(status);
create index idx_products_kind       on public.products(kind);
create index idx_products_published  on public.products(published_at desc);
create trigger trg_products_updated before update on public.products for each row execute function public.set_updated_at();

create table public.product_variants (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid not null references public.products(id) on delete cascade,
  sku             text unique,
  title           text not null,
  option1         text,                   -- e.g. flavor (Chocolate)
  option2         text,                   -- e.g. size (1kg / 2kg)
  option3         text,
  price_cents     integer not null check (price_cents >= 0),
  compare_at_cents integer check (compare_at_cents is null or compare_at_cents >= 0),
  currency        text not null default 'PKR',
  weight_grams    integer,
  requires_shipping boolean not null default true,
  taxable         boolean not null default true,
  is_digital      boolean not null default false,
  inventory_qty   integer not null default 0,
  inventory_policy text not null default 'deny' check (inventory_policy in ('deny','continue')),
  position        integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_variants_product on public.product_variants(product_id);
create trigger trg_variants_updated before update on public.product_variants for each row execute function public.set_updated_at();

create table public.product_categories (
  product_id  uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table public.product_media (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  alt         text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index idx_media_product on public.product_media(product_id);

create table public.product_reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  customer_email citext,
  customer_name  text,
  user_id     uuid references public.profiles(id) on delete set null,
  rating      integer not null check (rating between 1 and 5),
  title       text,
  body        text,
  verified_purchase boolean not null default false,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now()
);
create index idx_reviews_product on public.product_reviews(product_id);
create index idx_reviews_status on public.product_reviews(status);

-- RLS
alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.product_variants   enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_media      enable row level security;
alter table public.product_reviews    enable row level security;

-- Public reads (storefront)
create policy "categories_public_read" on public.categories     for select using (is_published or public.is_staff());
create policy "products_public_read"   on public.products       for select using (status = 'published' or public.is_staff());
create policy "variants_public_read"   on public.product_variants for select using (
  exists (select 1 from public.products p where p.id = product_variants.product_id and (p.status = 'published' or public.is_staff()))
);
create policy "media_public_read"      on public.product_media  for select using (
  exists (select 1 from public.products p where p.id = product_media.product_id and (p.status = 'published' or public.is_staff()))
);
create policy "pc_public_read"         on public.product_categories for select using (
  exists (select 1 from public.products p where p.id = product_categories.product_id and (p.status = 'published' or public.is_staff()))
);
create policy "reviews_public_read"    on public.product_reviews for select using (status = 'approved' or user_id = auth.uid() or public.is_staff());

-- Customer review submission (anyone authenticated can submit; goes to pending)
create policy "reviews_self_insert"    on public.product_reviews for insert with check (user_id = auth.uid());

-- Staff writes
create policy "categories_write" on public.categories         for all using (public.has_permission('collections.manage')) with check (public.has_permission('collections.manage'));
create policy "products_create"  on public.products           for insert with check (public.has_permission('products.create'));
create policy "products_update"  on public.products           for update using (public.has_permission('products.update')) with check (public.has_permission('products.update'));
create policy "products_delete"  on public.products           for delete using (public.has_permission('products.delete'));
create policy "variants_write"   on public.product_variants   for all using (public.has_permission('products.update')) with check (public.has_permission('products.update'));
create policy "media_write"      on public.product_media      for all using (public.has_permission('products.update')) with check (public.has_permission('products.update'));
create policy "pc_write"         on public.product_categories for all using (public.has_permission('collections.manage')) with check (public.has_permission('collections.manage'));
create policy "reviews_moderate" on public.product_reviews    for update using (public.has_permission('products.update')) with check (public.has_permission('products.update'));
