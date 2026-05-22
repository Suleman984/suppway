-- =============================================================================
-- 0008_product_media_storage.sql
-- Storage bucket for product images. Public read (images appear on the
-- storefront), staff-only write gated by the same `has_permission` function
-- used by the catalog tables.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,                                  -- public read; storefront fetches directly
  5 * 1024 * 1024,                       -- 5 MB per upload
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read of the published catalog's images.
drop policy if exists "product_media_public_read" on storage.objects;
create policy "product_media_public_read"
  on storage.objects
  for select
  using (bucket_id = 'product-media');

-- Staff write (uses the same RBAC function as products table).
drop policy if exists "product_media_staff_write" on storage.objects;
create policy "product_media_staff_write"
  on storage.objects
  for insert
  with check (
    bucket_id = 'product-media'
    and public.has_permission('products.update')
  );

drop policy if exists "product_media_staff_update" on storage.objects;
create policy "product_media_staff_update"
  on storage.objects
  for update
  using (
    bucket_id = 'product-media'
    and public.has_permission('products.update')
  )
  with check (
    bucket_id = 'product-media'
    and public.has_permission('products.update')
  );

drop policy if exists "product_media_staff_delete" on storage.objects;
create policy "product_media_staff_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'product-media'
    and public.has_permission('products.update')
  );
