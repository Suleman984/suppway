-- =============================================================================
-- 0011_checkout_verifications.sql
-- Email OTP rows used to prove an email belongs to whoever is checking out.
-- Closes the impersonation path where someone types another person's email
-- at guest checkout and the order later attaches to that person's account.
-- All reads/writes go through service-role server actions, so RLS is locked.
-- =============================================================================

create table public.checkout_verifications (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null,
  code_hash     text not null,
  attempts      integer not null default 0,
  max_attempts  integer not null default 5,
  expires_at    timestamptz not null,
  consumed_at   timestamptz,
  ip            inet,
  created_at    timestamptz not null default now()
);
create index idx_checkout_verifications_email_created
  on public.checkout_verifications(email, created_at desc);
create index idx_checkout_verifications_expires
  on public.checkout_verifications(expires_at);

alter table public.checkout_verifications enable row level security;
-- No public policies — service role only.
