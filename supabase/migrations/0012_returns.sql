-- =============================================================================
-- 0012_returns.sql
-- Customer-initiated refund/exchange requests. Flow:
--   customer submits  →  admin reviews (off-app comms with customer)
--                      →  approve_refund | approve_exchange | deny
-- Refund approvals route through the existing refundOrder pipeline.
-- Exchange approvals just mark intent — actual fulfilment is manual
-- (no shipping label integration in this phase).
-- =============================================================================

create table public.return_requests (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  requested_by    uuid references public.profiles(id) on delete set null,
  type            text not null check (type in ('refund','exchange')),
  status          text not null default 'pending'
                  check (status in ('pending','refunded','exchanged','denied')),
  reason          text,
  customer_message text not null,
  admin_notes     text,
  decided_by      uuid references public.profiles(id) on delete set null,
  decided_at      timestamptz,
  refund_amount_cents integer check (refund_amount_cents is null or refund_amount_cents > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_return_requests_order on public.return_requests(order_id);
create index idx_return_requests_status on public.return_requests(status);
create index idx_return_requests_requested_by on public.return_requests(requested_by);
create trigger trg_return_requests_updated
  before update on public.return_requests
  for each row execute function public.set_updated_at();

create table public.return_attachments (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.return_requests(id) on delete cascade,
  storage_path text not null,
  mime_type    text,
  byte_size    integer,
  created_at   timestamptz not null default now()
);
create index idx_return_attachments_request on public.return_attachments(request_id);

alter table public.return_requests enable row level security;
alter table public.return_attachments enable row level security;

-- Customer can read their own requests; staff with returns.view can read all.
create policy "return_requests_self_read" on public.return_requests
  for select using (
    requested_by = auth.uid()
    or public.has_permission('returns.view')
  );

-- Customer can insert requests for their own orders. We enforce that the
-- request's requested_by matches the auth user AND that the underlying
-- order is theirs.
create policy "return_requests_self_create" on public.return_requests
  for insert with check (
    requested_by = auth.uid()
    and exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = return_requests.order_id and c.user_id = auth.uid()
    )
  );

-- Staff with returns.decide can update (the decision step).
create policy "return_requests_staff_update" on public.return_requests
  for update using (public.has_permission('returns.decide'))
  with check (public.has_permission('returns.decide'));

-- Attachments: same access model as the parent request.
create policy "return_attachments_read" on public.return_attachments
  for select using (
    exists (
      select 1 from public.return_requests r
      where r.id = return_attachments.request_id
        and (r.requested_by = auth.uid() or public.has_permission('returns.view'))
    )
  );

create policy "return_attachments_insert" on public.return_attachments
  for insert with check (
    exists (
      select 1 from public.return_requests r
      where r.id = return_attachments.request_id
        and r.requested_by = auth.uid()
    )
  );

-- Permissions catalog: register the two new keys so RBAC can grant them.
insert into public.permissions (key, resource, action, description) values
  ('returns.view',   'returns', 'view',   'View refund / exchange requests'),
  ('returns.decide', 'returns', 'decide', 'Approve or deny refund / exchange requests')
on conflict (key) do nothing;

-- Grant defaults to roles that already manage orders. Return ops is a
-- sub-capability of order management.
insert into public.role_permissions (role_id, permission)
select r.id, p.key
  from public.roles r, public.permissions p
 where r.key in ('admin','store_manager','customer_support')
   and p.key in ('returns.view','returns.decide')
on conflict do nothing;

-- =============================================================================
-- Storage bucket for the photos customers attach to their request.
-- Private bucket — reads only via signed URLs from the server.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'return-attachments',
  'return-attachments',
  false,                                  -- private
  10 * 1024 * 1024,                       -- 10 MB per upload
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Customer can upload only under their own user-id prefix.
-- Path convention: `{auth.uid()}/{request_id_or_temp_id}/{filename}`.
drop policy if exists "return_attachments_self_upload" on storage.objects;
create policy "return_attachments_self_upload"
  on storage.objects
  for insert
  with check (
    bucket_id = 'return-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Customer can read their own uploads; staff with returns.view can read all.
drop policy if exists "return_attachments_read_self_or_staff" on storage.objects;
create policy "return_attachments_read_self_or_staff"
  on storage.objects
  for select
  using (
    bucket_id = 'return-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.has_permission('returns.view')
    )
  );

-- Customer can delete uploads in their own prefix (useful for re-upload).
drop policy if exists "return_attachments_self_delete" on storage.objects;
create policy "return_attachments_self_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'return-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
