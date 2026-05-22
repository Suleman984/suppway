-- =============================================================================
-- 0009_discounts.sql
-- Per-product, per-category and order-wide discounts. Either auto-applied
-- (code = NULL) or coupon-based (customer enters `code` at checkout).
--
-- Scope rules (enforced by check constraint):
--   product  → product_id required, category_id null
--   category → category_id required, product_id null
--   order    → both null
-- =============================================================================

create table public.discounts (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique,                                  -- NULL = auto-applied
  title               text not null,
  description         text,
  kind                text not null check (kind in ('percent','fixed')),
  -- percent: integer 1..100; fixed: amount in cents (>= 1).
  value               integer not null check (value > 0),
  scope               text not null check (scope in ('product','category','order')),
  product_id          uuid references public.products(id) on delete cascade,
  category_id         uuid references public.categories(id) on delete cascade,
  min_subtotal_cents  integer check (min_subtotal_cents is null or min_subtotal_cents >= 0),
  max_uses            integer check (max_uses is null or max_uses >= 1),
  uses_count          integer not null default 0,
  starts_at           timestamptz,
  ends_at             timestamptz,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint discounts_scope_target check (
    (scope = 'product'  and product_id  is not null and category_id is null) or
    (scope = 'category' and category_id is not null and product_id  is null) or
    (scope = 'order'    and product_id  is null     and category_id is null)
  ),
  constraint discounts_percent_bounds check (
    kind <> 'percent' or (value between 1 and 100)
  ),
  constraint discounts_date_order check (
    starts_at is null or ends_at is null or starts_at < ends_at
  )
);

create index idx_discounts_code     on public.discounts(code) where code is not null;
create index idx_discounts_product  on public.discounts(product_id)  where product_id  is not null;
create index idx_discounts_category on public.discounts(category_id) where category_id is not null;
create index idx_discounts_active   on public.discounts(is_active, ends_at);

create trigger trg_discounts_updated before update on public.discounts
  for each row execute function public.set_updated_at();

-- Register the new permissions in the catalog so admins can grant them.
insert into public.permissions (key, resource, action, description) values
  ('discounts.view',   'discounts', 'view',   'See discounts and coupon codes'),
  ('discounts.create', 'discounts', 'create', 'Create new discounts and coupons'),
  ('discounts.update', 'discounts', 'update', 'Edit existing discounts'),
  ('discounts.delete', 'discounts', 'delete', 'Delete discounts')
on conflict (key) do nothing;

-- Grant the new permissions to the admin + store_manager system roles.
do $$
declare
  r_admin uuid;
  r_manager uuid;
begin
  select id into r_admin   from public.roles where key = 'admin';
  select id into r_manager from public.roles where key = 'store_manager';

  if r_admin is not null then
    insert into public.role_permissions (role_id, permission) values
      (r_admin, 'discounts.view'),
      (r_admin, 'discounts.create'),
      (r_admin, 'discounts.update'),
      (r_admin, 'discounts.delete')
    on conflict do nothing;
  end if;

  if r_manager is not null then
    insert into public.role_permissions (role_id, permission) values
      (r_manager, 'discounts.view'),
      (r_manager, 'discounts.create'),
      (r_manager, 'discounts.update'),
      (r_manager, 'discounts.delete')
    on conflict do nothing;
  end if;
end $$;

-- RLS — public read of active, in-window discounts (so the storefront can
-- apply auto-discounts), staff can read everything; only staff with the
-- matching permission can write.
alter table public.discounts enable row level security;

create policy "discounts_public_read"
  on public.discounts for select
  using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >  now())
    or public.is_staff()
  );

create policy "discounts_staff_create"
  on public.discounts for insert
  with check (public.has_permission('discounts.create'));

create policy "discounts_staff_update"
  on public.discounts for update
  using       (public.has_permission('discounts.update'))
  with check  (public.has_permission('discounts.update'));

create policy "discounts_staff_delete"
  on public.discounts for delete
  using (public.has_permission('discounts.delete'));
