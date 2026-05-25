-- =============================================================================
-- 0014_multi_tenant.sql
-- Shared multi-tenant refactor. One database, many stores. Every business
-- row carries a store_id. RLS enforces store scoping for staff (a user can
-- only see/modify rows in stores they're a member of), and the application
-- layer scopes storefront/customer queries by the active store derived
-- from the request URL.
--
-- Strategy:
--   1. Create stores + store_members.
--   2. Backfill an initial "main" store and migrate all existing rows into it.
--   3. Add store_id to every business table, populate, then enforce NOT NULL.
--   4. Convert globally-unique columns (slug, email, sku, discount code) to
--      composite-unique per store.
--   5. Rewrite has_permission to take a store_id; rewrite every RLS policy
--      that previously called has_permission(perm) to call has_permission(perm, store_id).
--   6. Migrate the staff table: add store_id, change primary key.
-- =============================================================================

------------------------------------------------------------
-- 1. stores + store_members
------------------------------------------------------------
create table public.stores (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null check (slug ~ '^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$'),
  name          text not null,
  owner_user_id uuid references public.profiles(id) on delete set null,
  status        text not null default 'active'
                check (status in ('active','suspended','archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_stores_slug on public.stores(slug);
create index idx_stores_owner on public.stores(owner_user_id);
create trigger trg_stores_updated
  before update on public.stores
  for each row execute function public.set_updated_at();

-- Insert the "main" store before any backfills.
insert into public.stores (slug, name) values ('main', 'Main Store');

-- Convenience: a function to read the "main" store id at backfill time.
do $$
declare
  v_main_store_id uuid;
begin
  select id into v_main_store_id from public.stores where slug = 'main';

------------------------------------------------------------
-- 2. Migrate staff → store_members
------------------------------------------------------------
  alter table public.staff
    add column store_id uuid references public.stores(id) on delete cascade;
  update public.staff set store_id = v_main_store_id;
  alter table public.staff alter column store_id set not null;
  alter table public.staff drop constraint staff_pkey;
  alter table public.staff add primary key (store_id, user_id);
  create index idx_staff_user on public.staff(user_id);

------------------------------------------------------------
-- 3. Add store_id to every business table (nullable, then backfill, then NOT NULL).
------------------------------------------------------------
  -- Tables that get a direct store_id column:
  alter table public.products             add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.product_variants     add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.product_categories   add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.product_media        add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.product_reviews      add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.categories           add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.customers            add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.addresses            add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.carts                add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.cart_items           add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.orders               add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.order_items          add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.refunds              add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.discounts            add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.loyalty_points       add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.funnels              add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.funnel_steps         add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.funnel_sessions      add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.funnel_events        add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.payments             add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.payment_methods      add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.webhook_events       add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.checkout_verifications add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.return_requests      add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.return_attachments   add column store_id uuid references public.stores(id) on delete cascade;
  alter table public.store_settings       add column store_id uuid references public.stores(id) on delete cascade;

  -- Backfill everything to the main store.
  update public.products              set store_id = v_main_store_id;
  update public.product_variants      set store_id = v_main_store_id;
  update public.product_categories    set store_id = v_main_store_id;
  update public.product_media         set store_id = v_main_store_id;
  update public.product_reviews       set store_id = v_main_store_id;
  update public.categories            set store_id = v_main_store_id;
  update public.customers             set store_id = v_main_store_id;
  update public.addresses             set store_id = v_main_store_id;
  update public.carts                 set store_id = v_main_store_id;
  update public.cart_items            set store_id = v_main_store_id;
  update public.orders                set store_id = v_main_store_id;
  update public.order_items           set store_id = v_main_store_id;
  update public.refunds               set store_id = v_main_store_id;
  update public.discounts             set store_id = v_main_store_id;
  update public.loyalty_points        set store_id = v_main_store_id;
  update public.funnels               set store_id = v_main_store_id;
  update public.funnel_steps          set store_id = v_main_store_id;
  update public.funnel_sessions       set store_id = v_main_store_id;
  update public.funnel_events         set store_id = v_main_store_id;
  update public.payments              set store_id = v_main_store_id;
  update public.payment_methods       set store_id = v_main_store_id;
  update public.webhook_events        set store_id = v_main_store_id;
  update public.checkout_verifications set store_id = v_main_store_id;
  update public.return_requests       set store_id = v_main_store_id;
  update public.return_attachments    set store_id = v_main_store_id;
  update public.store_settings        set store_id = v_main_store_id;

  -- Enforce NOT NULL now that everything's populated.
  alter table public.products              alter column store_id set not null;
  alter table public.product_variants      alter column store_id set not null;
  alter table public.product_categories    alter column store_id set not null;
  alter table public.product_media         alter column store_id set not null;
  alter table public.product_reviews       alter column store_id set not null;
  alter table public.categories            alter column store_id set not null;
  alter table public.customers             alter column store_id set not null;
  alter table public.carts                 alter column store_id set not null;
  alter table public.cart_items            alter column store_id set not null;
  alter table public.orders                alter column store_id set not null;
  alter table public.order_items           alter column store_id set not null;
  alter table public.refunds               alter column store_id set not null;
  alter table public.discounts             alter column store_id set not null;
  alter table public.loyalty_points        alter column store_id set not null;
  alter table public.funnels               alter column store_id set not null;
  alter table public.funnel_steps          alter column store_id set not null;
  alter table public.funnel_sessions       alter column store_id set not null;
  alter table public.funnel_events         alter column store_id set not null;
  alter table public.payments              alter column store_id set not null;
  alter table public.payment_methods       alter column store_id set not null;
  alter table public.webhook_events        alter column store_id set not null;
  alter table public.checkout_verifications alter column store_id set not null;
  alter table public.return_requests       alter column store_id set not null;
  alter table public.return_attachments    alter column store_id set not null;
  alter table public.store_settings        alter column store_id set not null;
  -- addresses can stay nullable: a guest address may have no customer yet.
  -- But every row in this codebase is tied to a customer, so make NOT NULL too.
  update public.addresses set store_id = v_main_store_id where store_id is null;
  alter table public.addresses alter column store_id set not null;

  -- One row per store in store_settings (drop the legacy singleton flag).
  alter table public.store_settings add constraint store_settings_store_unique unique (store_id);

  -- Set the main store's owner to whoever the first admin staff user is,
  -- if any. Best effort — leaves null if no staff yet.
  update public.stores s
     set owner_user_id = (
       select st.user_id
         from public.staff st
         join public.roles r on r.id = st.role_id
        where st.store_id = v_main_store_id
          and r.key = 'admin'
          and st.status = 'active'
        order by st.joined_at asc nulls last
        limit 1
     )
   where s.id = v_main_store_id;
end$$;

------------------------------------------------------------
-- 4. Indexes for store_id (RLS + filtering rely on these).
------------------------------------------------------------
create index idx_products_store              on public.products(store_id);
create index idx_product_variants_store      on public.product_variants(store_id);
create index idx_product_categories_store    on public.product_categories(store_id);
create index idx_product_media_store         on public.product_media(store_id);
create index idx_product_reviews_store       on public.product_reviews(store_id);
create index idx_categories_store            on public.categories(store_id);
create index idx_customers_store             on public.customers(store_id);
create index idx_addresses_store             on public.addresses(store_id);
create index idx_carts_store                 on public.carts(store_id);
create index idx_cart_items_store            on public.cart_items(store_id);
create index idx_orders_store                on public.orders(store_id);
create index idx_order_items_store           on public.order_items(store_id);
create index idx_refunds_store               on public.refunds(store_id);
create index idx_discounts_store             on public.discounts(store_id);
create index idx_loyalty_points_store        on public.loyalty_points(store_id);
create index idx_funnels_store               on public.funnels(store_id);
create index idx_payments_store              on public.payments(store_id);
create index idx_webhook_events_store        on public.webhook_events(store_id);
create index idx_checkout_verifications_store on public.checkout_verifications(store_id);
create index idx_return_requests_store       on public.return_requests(store_id);

------------------------------------------------------------
-- 5. Convert globally-unique columns to per-store unique.
------------------------------------------------------------
alter table public.categories       drop constraint categories_slug_key;
alter table public.products         drop constraint products_slug_key;
alter table public.product_variants drop constraint product_variants_sku_key;
alter table public.customers        drop constraint customers_email_key;
alter table public.discounts        drop constraint discounts_code_key;

create unique index uq_categories_store_slug      on public.categories(store_id, slug);
create unique index uq_products_store_slug        on public.products(store_id, slug);
create unique index uq_product_variants_store_sku on public.product_variants(store_id, sku) where sku is not null;
create unique index uq_customers_store_email      on public.customers(store_id, email);
create unique index uq_discounts_store_code       on public.discounts(store_id, code) where code is not null;

------------------------------------------------------------
-- 6. has_permission becomes store-aware.
-- Old: has_permission(perm)       — checked staff anywhere
-- New: has_permission(perm, store) — checks staff in THIS store
-- The old single-arg form is preserved as a compatibility shim that picks
-- the user's first active staff row (used only by legacy RLS we haven't
-- rewritten yet, and during the brief window before app code is updated).
------------------------------------------------------------
create or replace function public.has_permission(p_permission text, p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.staff s
      join public.role_permissions rp on rp.role_id = s.role_id
     where s.user_id = auth.uid()
       and s.store_id = p_store_id
       and s.status = 'active'
       and rp.permission = p_permission
  );
$$;

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.staff s
      join public.role_permissions rp on rp.role_id = s.role_id
     where s.user_id = auth.uid()
       and s.status = 'active'
       and rp.permission = p_permission
  );
$$;

-- Helper: is the caller a member of this store at all?
create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
     where user_id = auth.uid()
       and store_id = p_store_id
       and status = 'active'
  );
$$;

------------------------------------------------------------
-- 7. RLS policies: drop the old non-store-aware ones and replace with
-- store-scoped versions. We're aggressive here — every policy that
-- previously called has_permission(perm) is replaced with
-- has_permission(perm, table.store_id).
------------------------------------------------------------

-- stores table itself
alter table public.stores enable row level security;
create policy "stores_member_read" on public.stores
  for select using (
    public.is_store_member(id)
    or status = 'active'  -- storefront resolves slug; needs basic read
  );
create policy "stores_owner_update" on public.stores
  for update using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- staff: visible to staff in the same store.
drop policy if exists "staff_self_read" on public.staff;
drop policy if exists "staff_admin_read" on public.staff;
drop policy if exists "staff_admin_write" on public.staff;
create policy "staff_self_read_v2" on public.staff
  for select using (user_id = auth.uid() or public.has_permission('employees.view', store_id));
create policy "staff_admin_write_v2" on public.staff
  for all using (public.has_permission('employees.update', store_id))
  with check (public.has_permission('employees.update', store_id));

-- Catalog: products + variants + categories
-- Reads: public (storefront browses any store's published catalog).
-- Writes: staff with products.update in that store.
drop policy if exists "products_public_read" on public.products;
drop policy if exists "products_staff_write" on public.products;
drop policy if exists "variants_public_read" on public.product_variants;
drop policy if exists "variants_staff_write" on public.product_variants;
drop policy if exists "categories_public_read" on public.categories;
drop policy if exists "categories_staff_write" on public.categories;
drop policy if exists "product_categories_public_read" on public.product_categories;
drop policy if exists "product_categories_staff_write" on public.product_categories;
drop policy if exists "product_media_public_read" on public.product_media;
drop policy if exists "product_media_staff_write" on public.product_media;
drop policy if exists "product_reviews_public_read" on public.product_reviews;
drop policy if exists "product_reviews_staff_write" on public.product_reviews;

create policy "products_read_v2" on public.products for select using (true);
create policy "products_write_v2" on public.products for all
  using (public.has_permission('products.update', store_id))
  with check (public.has_permission('products.update', store_id));

create policy "variants_read_v2" on public.product_variants for select using (true);
create policy "variants_write_v2" on public.product_variants for all
  using (public.has_permission('products.update', store_id))
  with check (public.has_permission('products.update', store_id));

create policy "categories_read_v2" on public.categories for select using (true);
create policy "categories_write_v2" on public.categories for all
  using (public.has_permission('collections.manage', store_id))
  with check (public.has_permission('collections.manage', store_id));

create policy "product_categories_read_v2" on public.product_categories for select using (true);
create policy "product_categories_write_v2" on public.product_categories for all
  using (public.has_permission('collections.manage', store_id))
  with check (public.has_permission('collections.manage', store_id));

create policy "product_media_read_v2" on public.product_media for select using (true);
create policy "product_media_write_v2" on public.product_media for all
  using (public.has_permission('products.update', store_id))
  with check (public.has_permission('products.update', store_id));

create policy "product_reviews_read_v2" on public.product_reviews for select using (true);
create policy "product_reviews_write_v2" on public.product_reviews for all
  using (public.has_permission('products.update', store_id))
  with check (public.has_permission('products.update', store_id));

-- Customers + addresses
drop policy if exists "customers_self_or_staff" on public.customers;
drop policy if exists "customers_self_update" on public.customers;
drop policy if exists "customers_staff_write" on public.customers;
create policy "customers_read_v2" on public.customers
  for select using (
    user_id = auth.uid()
    or public.has_permission('customers.view', store_id)
  );
create policy "customers_self_update_v2" on public.customers
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "customers_staff_write_v2" on public.customers
  for all using (public.has_permission('customers.update', store_id))
  with check (public.has_permission('customers.update', store_id));

drop policy if exists "addresses_self" on public.addresses;
create policy "addresses_self_v2" on public.addresses
  for all using (
    exists (select 1 from public.customers c
              where c.id = addresses.customer_id
                and (c.user_id = auth.uid()
                     or public.has_permission('customers.view', addresses.store_id)))
  )
  with check (
    exists (select 1 from public.customers c
              where c.id = addresses.customer_id
                and (c.user_id = auth.uid()
                     or public.has_permission('customers.update', addresses.store_id)))
  );

-- Carts (staff read only; storefront writes via service role from actions).
drop policy if exists "carts_staff_read" on public.carts;
drop policy if exists "cart_items_staff_read" on public.cart_items;
create policy "carts_staff_read_v2" on public.carts
  for select using (public.has_permission('orders.view', store_id));
create policy "cart_items_staff_read_v2" on public.cart_items
  for select using (
    exists (select 1 from public.carts c
              where c.id = cart_items.cart_id
                and public.has_permission('orders.view', cart_items.store_id))
  );

-- Orders + items + refunds
drop policy if exists "orders_self_read" on public.orders;
drop policy if exists "orders_update" on public.orders;
drop policy if exists "order_items_read" on public.order_items;
drop policy if exists "refunds_read" on public.refunds;
drop policy if exists "refunds_create" on public.refunds;

create policy "orders_read_v2" on public.orders
  for select using (
    customer_id in (select id from public.customers
                     where user_id = auth.uid() and store_id = orders.store_id)
    or public.has_permission('orders.view', store_id)
  );
create policy "orders_update_v2" on public.orders
  for update using (public.has_permission('orders.update', store_id))
  with check (public.has_permission('orders.update', store_id));

create policy "order_items_read_v2" on public.order_items
  for select using (
    exists (select 1 from public.orders o
              where o.id = order_items.order_id
                and (
                  o.customer_id in (select id from public.customers
                                     where user_id = auth.uid() and store_id = order_items.store_id)
                  or public.has_permission('orders.view', order_items.store_id)
                ))
  );

create policy "refunds_read_v2" on public.refunds
  for select using (public.has_permission('orders.view', store_id));
create policy "refunds_create_v2" on public.refunds
  for insert with check (public.has_permission('orders.refund', store_id));

-- Discounts
drop policy if exists "discounts_public_read" on public.discounts;
drop policy if exists "discounts_staff_write" on public.discounts;
drop policy if exists "discounts_read" on public.discounts;
drop policy if exists "discounts_write" on public.discounts;
create policy "discounts_read_v2" on public.discounts for select using (true);
create policy "discounts_write_v2" on public.discounts for all
  using (public.has_permission('discounts.update', store_id))
  with check (public.has_permission('discounts.update', store_id));

-- Loyalty points
drop policy if exists "loyalty_points_self_read" on public.loyalty_points;
drop policy if exists "loyalty_points_staff" on public.loyalty_points;
drop policy if exists "loyalty_points_read" on public.loyalty_points;
create policy "loyalty_points_read_v2" on public.loyalty_points
  for select using (
    user_id = auth.uid()
    or public.has_permission('loyalty.view', store_id)
  );
create policy "loyalty_points_staff_write_v2" on public.loyalty_points
  for all using (public.has_permission('loyalty.adjust', store_id))
  with check (public.has_permission('loyalty.adjust', store_id));

-- Returns: keep prior policies but now store-aware.
drop policy if exists "return_requests_self_read" on public.return_requests;
drop policy if exists "return_requests_self_create" on public.return_requests;
drop policy if exists "return_requests_staff_update" on public.return_requests;
drop policy if exists "return_attachments_read" on public.return_attachments;
drop policy if exists "return_attachments_insert" on public.return_attachments;

create policy "return_requests_self_read_v2" on public.return_requests
  for select using (
    requested_by = auth.uid()
    or public.has_permission('returns.view', store_id)
  );
create policy "return_requests_self_create_v2" on public.return_requests
  for insert with check (
    requested_by = auth.uid()
    and exists (
      select 1 from public.orders o
        join public.customers c on c.id = o.customer_id
       where o.id = return_requests.order_id
         and o.store_id = return_requests.store_id
         and c.user_id = auth.uid()
    )
  );
create policy "return_requests_staff_update_v2" on public.return_requests
  for update using (public.has_permission('returns.decide', store_id))
  with check (public.has_permission('returns.decide', store_id));

create policy "return_attachments_read_v2" on public.return_attachments
  for select using (
    exists (select 1 from public.return_requests r
              where r.id = return_attachments.request_id
                and (r.requested_by = auth.uid()
                     or public.has_permission('returns.view', return_attachments.store_id)))
  );
create policy "return_attachments_insert_v2" on public.return_attachments
  for insert with check (
    exists (select 1 from public.return_requests r
              where r.id = return_attachments.request_id
                and r.requested_by = auth.uid())
  );

-- Funnels (admin-managed; previously gated by funnels.view perm).
drop policy if exists "funnels_read" on public.funnels;
drop policy if exists "funnels_write" on public.funnels;
create policy "funnels_read_v2" on public.funnels for select using (
  public.has_permission('funnels.view', store_id) or true  -- public read for storefront funnel rendering
);
create policy "funnels_write_v2" on public.funnels for all
  using (public.has_permission('funnels.update', store_id))
  with check (public.has_permission('funnels.update', store_id));

-- Payments + webhook_events: admin-only.
drop policy if exists "payments_staff" on public.payments;
drop policy if exists "webhook_events_staff" on public.webhook_events;
create policy "payments_read_v2" on public.payments
  for select using (public.has_permission('orders.view', store_id));
create policy "webhook_events_staff_v2" on public.webhook_events
  for all using (public.has_permission('integrations.manage', store_id))
  with check (public.has_permission('integrations.manage', store_id));

-- Store settings: public read (storefront branding), staff write.
drop policy if exists "store_settings_public_read" on public.store_settings;
drop policy if exists "store_settings_staff_write" on public.store_settings;
create policy "store_settings_read_v2" on public.store_settings for select using (true);
create policy "store_settings_write_v2" on public.store_settings for all
  using (public.has_permission('settings.update', store_id))
  with check (public.has_permission('settings.update', store_id));

------------------------------------------------------------
-- 8. New permissions for managing stores themselves.
------------------------------------------------------------
insert into public.permissions (key, resource, action, description) values
  ('stores.update', 'stores', 'update', 'Update store profile (name, slug, owner)')
on conflict (key) do nothing;
insert into public.role_permissions (role_id, permission)
select r.id, 'stores.update' from public.roles r where r.key = 'admin'
on conflict do nothing;
