-- =============================================================================
-- 0013_shipping_tracking.sql
-- Manual shipping tracking on orders. Admin enters a carrier + tracking
-- number; fulfillOrder emails the customer with the tracking link.
-- No carrier API integration in this phase — labels/rates come later.
-- =============================================================================

alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists tracking_carrier text,
  add column if not exists tracking_url text,
  add column if not exists shipped_at timestamptz;
