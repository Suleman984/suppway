-- =============================================================================
-- 0006_payments.sql
-- Saved payment methods (one-click upsells), payments, idempotent webhooks.
-- Provider credentials live in env, not DB — single store deployment.
-- =============================================================================

create table public.payment_methods (
  id                   uuid primary key default gen_random_uuid(),
  customer_id          uuid not null references public.customers(id) on delete cascade,
  provider             text not null check (provider in ('stripe','jazzcash','easypaisa','safepay','paypal')),
  provider_customer_id text not null,
  provider_method_id   text not null,
  brand                text,
  last4                text,
  exp_month            integer,
  exp_year             integer,
  is_default           boolean not null default false,
  created_at           timestamptz not null default now()
);
create index idx_pm_customer on public.payment_methods(customer_id);

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid references public.orders(id) on delete set null,
  provider        text not null,
  provider_payment_id text,
  amount_cents    integer not null,
  currency        text not null,
  status          text not null check (status in ('requires_action','processing','succeeded','failed','refunded','partially_refunded')),
  failure_reason  text,
  raw             jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_payments_order on public.payments(order_id);
create trigger trg_payments_updated before update on public.payments for each row execute function public.set_updated_at();

-- Idempotent webhook log
create table public.webhook_events (
  id          uuid primary key default gen_random_uuid(),
  provider    text not null,
  external_id text not null,
  event_type  text not null,
  payload     jsonb not null,
  processed_at timestamptz,
  error       text,
  created_at  timestamptz not null default now(),
  unique (provider, external_id)
);
create index idx_webhook_events_type on public.webhook_events(provider, event_type);

-- RLS
alter table public.payment_methods enable row level security;
alter table public.payments        enable row level security;
alter table public.webhook_events  enable row level security;

create policy "pm_self_or_staff" on public.payment_methods
  for select using (
    customer_id in (select id from public.customers where user_id = auth.uid())
    or public.has_permission('customers.view')
  );

create policy "payments_read" on public.payments for select using (public.has_permission('orders.view'));
create policy "webhook_events_staff_read" on public.webhook_events for select using (public.has_permission('orders.view'));
