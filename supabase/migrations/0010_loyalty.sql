-- =============================================================================
-- 0010_loyalty.sql
-- Loyalty point ledger. Append-only: every earn/redeem/adjust event is a row.
-- A summary view exposes the per-user balance so the storefront and admin
-- can query it cheaply without scanning the ledger every time.
--
-- Earn rate / redeem rate are NOT stored here — those live in store_settings
-- (added in a later migration when checkout is wired) and are applied by the
-- server when an order is paid. This table only records the events.
-- =============================================================================

create table public.loyalty_points (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  order_id    uuid references public.orders(id) on delete set null,
  -- positive = earn, negative = redeem / expire / staff adjustment.
  delta       integer not null check (delta <> 0),
  reason      text not null check (reason in (
                'purchase','redeem','adjustment','expire','signup','review','referral'
              )),
  note        text,
  created_at  timestamptz not null default now()
);

create index idx_loyalty_user        on public.loyalty_points(user_id, created_at desc);
create index idx_loyalty_order       on public.loyalty_points(order_id) where order_id is not null;
create index idx_loyalty_user_reason on public.loyalty_points(user_id, reason);

-- Per-user balance view. `security_invoker` keeps RLS evaluation on the
-- caller's identity so customers can only see their own balance.
create or replace view public.loyalty_balances
  with (security_invoker = true)
as
select
  user_id,
  coalesce(sum(delta), 0)::integer                                   as balance,
  coalesce(sum(case when delta > 0 then delta else 0 end), 0)::integer as lifetime_earned,
  coalesce(sum(case when delta < 0 then -delta else 0 end), 0)::integer as lifetime_redeemed,
  max(created_at)                                                    as last_event_at
from public.loyalty_points
group by user_id;

-- Permissions catalog
insert into public.permissions (key, resource, action, description) values
  ('loyalty.view',   'loyalty', 'view',   'View loyalty point history and balances'),
  ('loyalty.adjust', 'loyalty', 'adjust', 'Manually adjust customer loyalty points')
on conflict (key) do nothing;

do $$
declare
  r_admin uuid;
  r_manager uuid;
  r_support uuid;
begin
  select id into r_admin   from public.roles where key = 'admin';
  select id into r_manager from public.roles where key = 'store_manager';
  select id into r_support from public.roles where key = 'customer_support';

  if r_admin is not null then
    insert into public.role_permissions (role_id, permission) values
      (r_admin, 'loyalty.view'),
      (r_admin, 'loyalty.adjust')
    on conflict do nothing;
  end if;

  if r_manager is not null then
    insert into public.role_permissions (role_id, permission) values
      (r_manager, 'loyalty.view'),
      (r_manager, 'loyalty.adjust')
    on conflict do nothing;
  end if;

  if r_support is not null then
    insert into public.role_permissions (role_id, permission) values
      (r_support, 'loyalty.view'),
      (r_support, 'loyalty.adjust')
    on conflict do nothing;
  end if;
end $$;

-- RLS
alter table public.loyalty_points enable row level security;

-- Customer can read their own ledger; staff with loyalty.view can read all.
create policy "loyalty_self_read"
  on public.loyalty_points for select
  using (user_id = auth.uid() or public.has_permission('loyalty.view'));

-- Only staff can write (purchase events are inserted by the server using a
-- staff session; ad-hoc adjustments go through the admin UI).
create policy "loyalty_staff_write"
  on public.loyalty_points for insert
  with check (public.has_permission('loyalty.adjust'));

create policy "loyalty_staff_update"
  on public.loyalty_points for update
  using       (public.has_permission('loyalty.adjust'))
  with check  (public.has_permission('loyalty.adjust'));

create policy "loyalty_staff_delete"
  on public.loyalty_points for delete
  using (public.has_permission('loyalty.adjust'));
