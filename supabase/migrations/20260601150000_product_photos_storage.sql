-- Create product-photos bucket (public read, authenticated write)
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

-- Authenticated users can upload
create policy "auth users can upload product photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-photos');

-- Authenticated users can update their uploads
create policy "auth users can update product photos"
on storage.objects for update
to authenticated
using (bucket_id = 'product-photos');

-- Authenticated users can delete photos
create policy "auth users can delete product photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-photos');

-- Public read access (matches the public bucket setting)
create policy "public can view product photos"
on storage.objects for select
using (bucket_id = 'product-photos');
