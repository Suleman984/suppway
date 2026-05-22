-- =============================================================================
-- 0005_funnels.sql
-- The funnel engine — same as before but tenant-less.
-- =============================================================================

create table public.funnels (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  description   text,
  status        text not null default 'draft' check (status in ('draft','published','archived')),
  entry_step_id uuid,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_funnels_updated before update on public.funnels for each row execute function public.set_updated_at();

create table public.funnel_steps (
  id           uuid primary key default gen_random_uuid(),
  funnel_id    uuid not null references public.funnels(id) on delete cascade,
  slug         text not null,
  kind         text not null check (kind in ('landing','checkout','upsell','downsell','order_bump','thank_you','custom')),
  title        text not null,
  position     integer not null default 0,
  variant_id   uuid references public.product_variants(id) on delete set null,
  offer_price_cents integer,
  on_accept_step_id  uuid references public.funnel_steps(id) on delete set null,
  on_decline_step_id uuid references public.funnel_steps(id) on delete set null,
  content      jsonb not null default '{}'::jsonb,
  conditions   jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (funnel_id, slug)
);
create index idx_funnel_steps_funnel on public.funnel_steps(funnel_id);
create trigger trg_funnel_steps_updated before update on public.funnel_steps for each row execute function public.set_updated_at();

alter table public.funnels add constraint fk_funnels_entry
  foreign key (entry_step_id) references public.funnel_steps(id) on delete set null;

create table public.funnel_sessions (
  id              uuid primary key default gen_random_uuid(),
  funnel_id       uuid not null references public.funnels(id) on delete cascade,
  token           text not null unique,
  customer_id     uuid references public.customers(id) on delete set null,
  cart_id         uuid references public.carts(id) on delete set null,
  current_step_id uuid references public.funnel_steps(id) on delete set null,
  initial_order_id uuid references public.orders(id) on delete set null,
  attribution     jsonb not null default '{}'::jsonb,
  context         jsonb not null default '{}'::jsonb,
  status          text not null default 'open' check (status in ('open','converted','abandoned','expired')),
  expires_at      timestamptz not null default (now() + interval '24 hours'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_funnel_sessions_funnel on public.funnel_sessions(funnel_id);
create trigger trg_funnel_sessions_updated before update on public.funnel_sessions for each row execute function public.set_updated_at();

create table public.funnel_events (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.funnel_sessions(id) on delete cascade,
  step_id     uuid references public.funnel_steps(id) on delete set null,
  kind        text not null check (kind in ('viewed','accepted','declined','converted','abandoned')),
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index idx_funnel_events_session on public.funnel_events(session_id);
create index idx_funnel_events_kind    on public.funnel_events(kind);

-- RLS
alter table public.funnels         enable row level security;
alter table public.funnel_steps    enable row level security;
alter table public.funnel_sessions enable row level security;
alter table public.funnel_events   enable row level security;

create policy "funnels_public_read" on public.funnels
  for select using (status = 'published' or public.has_permission('funnels.view'));

create policy "funnel_steps_public_read" on public.funnel_steps
  for select using (
    exists (select 1 from public.funnels f where f.id = funnel_steps.funnel_id and (f.status = 'published' or public.has_permission('funnels.view')))
  );

create policy "funnels_create" on public.funnels for insert with check (public.has_permission('funnels.create'));
create policy "funnels_update" on public.funnels for update using (public.has_permission('funnels.update')) with check (public.has_permission('funnels.update'));
create policy "funnels_delete" on public.funnels for delete using (public.has_permission('funnels.delete'));

create policy "funnel_steps_write" on public.funnel_steps for all
  using (public.has_permission('funnels.update')) with check (public.has_permission('funnels.update'));

create policy "funnel_sessions_staff_read" on public.funnel_sessions for select using (public.has_permission('funnels.view'));
create policy "funnel_events_staff_read"   on public.funnel_events   for select using (public.has_permission('funnels.view'));
