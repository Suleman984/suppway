-- =============================================================================
-- 0004_orders.sql
-- Customers, addresses, carts, orders, refunds.
-- =============================================================================

create table public.customers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete set null, -- null for guest checkouts
  email         citext unique not null,
  first_name    text,
  last_name     text,
  phone         text,
  marketing_opt_in boolean not null default false,
  total_spent_cents bigint not null default 0,
  orders_count  integer not null default 0,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_customers_updated before update on public.customers for each row execute function public.set_updated_at();

create table public.addresses (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid references public.customers(id) on delete cascade,
  first_name   text,
  last_name    text,
  company      text,
  address1     text not null,
  address2     text,
  city         text not null,
  province     text,
  country      text not null default 'PK',
  postal_code  text,
  phone        text,
  is_default_billing  boolean not null default false,
  is_default_shipping boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.carts (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  token       text not null unique,
  currency    text not null default 'PKR',
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  metadata    jsonb not null default '{}'::jsonb,
  expires_at  timestamptz not null default (now() + interval '30 days'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_carts_updated before update on public.carts for each row execute function public.set_updated_at();

create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts(id) on delete cascade,
  variant_id  uuid not null references public.product_variants(id) on delete restrict,
  quantity    integer not null check (quantity > 0),
  price_cents integer not null,
  created_at  timestamptz not null default now()
);
create index idx_cart_items_cart on public.cart_items(cart_id);

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references public.customers(id) on delete set null,
  order_number    text unique not null,
  status          text not null default 'pending'
                  check (status in ('pending','paid','partially_refunded','refunded','fulfilled','canceled','failed')),
  fulfillment_status text not null default 'unfulfilled'
                  check (fulfillment_status in ('unfulfilled','partial','fulfilled')),
  email           citext not null,
  currency        text not null default 'PKR',
  subtotal_cents  integer not null default 0,
  discount_cents  integer not null default 0,
  shipping_cents  integer not null default 0,
  tax_cents       integer not null default 0,
  total_cents     integer not null default 0,
  refunded_cents  integer not null default 0,
  shipping_address jsonb,
  billing_address  jsonb,
  source          text not null default 'storefront' check (source in ('storefront','funnel','admin','api')),
  funnel_session_id uuid,
  notes           text,
  metadata        jsonb not null default '{}'::jsonb,
  placed_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_orders_status   on public.orders(status);
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_funnel   on public.orders(funnel_session_id);
create trigger trg_orders_updated before update on public.orders for each row execute function public.set_updated_at();

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  variant_id      uuid not null references public.product_variants(id) on delete restrict,
  product_title   text not null,
  variant_title   text,
  sku             text,
  quantity        integer not null check (quantity > 0),
  price_cents     integer not null,
  total_cents     integer not null,
  is_upsell       boolean not null default false,
  is_order_bump   boolean not null default false,
  funnel_step_id  uuid,
  created_at      timestamptz not null default now()
);
create index idx_order_items_order on public.order_items(order_id);

create table public.refunds (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  reason      text,
  processed_by uuid references public.profiles(id),
  provider_refund_id text,
  created_at  timestamptz not null default now()
);
create index idx_refunds_order on public.refunds(order_id);

-- RLS
alter table public.customers   enable row level security;
alter table public.addresses   enable row level security;
alter table public.carts       enable row level security;
alter table public.cart_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.refunds     enable row level security;

-- Customers can read their own; staff with customers.view can read all
create policy "customers_self_or_staff" on public.customers
  for select using (user_id = auth.uid() or public.has_permission('customers.view'));
create policy "customers_self_update" on public.customers
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "customers_staff_write" on public.customers
  for all using (public.has_permission('customers.update')) with check (public.has_permission('customers.update'));

create policy "addresses_self" on public.addresses
  for all using (
    exists (select 1 from public.customers c where c.id = addresses.customer_id and (c.user_id = auth.uid() or public.has_permission('customers.view')))
  ) with check (
    exists (select 1 from public.customers c where c.id = addresses.customer_id and (c.user_id = auth.uid() or public.has_permission('customers.update')))
  );

-- Carts: storefront writes via service role from Server Actions; staff with orders.view can read
create policy "carts_staff_read" on public.carts for select using (public.has_permission('orders.view'));
create policy "cart_items_staff_read" on public.cart_items for select using (
  exists (select 1 from public.carts c where c.id = cart_items.cart_id and public.has_permission('orders.view'))
);

-- Orders
create policy "orders_self_read" on public.orders
  for select using (
    customer_id in (select id from public.customers where user_id = auth.uid())
    or public.has_permission('orders.view')
  );
create policy "orders_update" on public.orders
  for update using (public.has_permission('orders.update')) with check (public.has_permission('orders.update'));

create policy "order_items_read" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and (
      o.customer_id in (select id from public.customers where user_id = auth.uid())
      or public.has_permission('orders.view')
    ))
  );

create policy "refunds_read" on public.refunds for select using (public.has_permission('orders.view'));
create policy "refunds_create" on public.refunds for insert with check (public.has_permission('orders.refund'));
