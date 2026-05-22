-- =============================================================================
-- 0001_init.sql
-- Foundation for a single-tenant gym ecommerce store:
--   - extensions + helpers
--   - profiles (extends auth.users)
--   - store_settings (singleton — branding, theme, contact, defaults)
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — every authenticated user (customers and staff)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       citext not null,
  full_name   text,
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger trg_on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- store_settings — singleton row holding everything that varies between
-- deployments without a code change: name, theme, branding, contact info.
-- The singleton is enforced by a unique check on `singleton = true`.
-- -----------------------------------------------------------------------------
create table public.store_settings (
  id                uuid primary key default gen_random_uuid(),
  singleton         boolean not null default true,
  name              text not null default 'Iron Forge',
  tagline           text default 'Fuel your strongest self',
  description       text,
  contact_email     citext,
  contact_phone     text,
  whatsapp_number   text,
  address           text,

  -- Theme
  active_theme      text not null default 'classic',
  custom_brand_color text,                       -- optional override on top of theme
  logo_url          text,
  favicon_url       text,
  hero_image_url    text,
  hero_headline     text default 'Train hard. Eat clean. Lift heavier.',
  hero_subheadline  text,

  -- Defaults
  default_locale    text not null default 'en',
  default_currency  text not null default 'PKR',

  -- Marketing / SEO
  seo_title         text,
  seo_description   text,
  social            jsonb not null default '{}'::jsonb,    -- { instagram, tiktok, youtube, facebook }

  -- Misc
  flags             jsonb not null default '{}'::jsonb,    -- feature flags (e.g. show_reviews: true)

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint singleton_only check (singleton = true)
);
create unique index idx_store_settings_singleton on public.store_settings((singleton));
create trigger trg_store_settings_updated before update on public.store_settings
  for each row execute function public.set_updated_at();

-- Seed the singleton row
insert into public.store_settings (singleton) values (true) on conflict do nothing;

-- RLS
alter table public.profiles       enable row level security;
alter table public.store_settings enable row level security;

create policy "profiles_self_select" on public.profiles for select using (id = auth.uid());
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- store_settings: readable by everyone (storefront needs theme + branding)
create policy "store_settings_public_read" on public.store_settings for select using (true);
-- writes gated in 0002 once permissions exist
