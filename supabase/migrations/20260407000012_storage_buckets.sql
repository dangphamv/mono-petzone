-- Create storage buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('pet-photos', 'pet-photos', true);
insert into storage.buckets (id, name, public) values ('provider-photos', 'provider-photos', true);
insert into storage.buckets (id, name, public) values ('check-in-photos', 'check-in-photos', false);
insert into storage.buckets (id, name, public) values ('chat-media', 'chat-media', false);
insert into storage.buckets (id, name, public) values ('review-photos', 'review-photos', true);

-- Avatars: anyone can read, authenticated users can upload their own
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars_auth_upload" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_auth_update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_auth_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Pet photos: public read, owner upload
create policy "pet_photos_public_read" on storage.objects for select
  using (bucket_id = 'pet-photos');
create policy "pet_photos_auth_upload" on storage.objects for insert
  with check (bucket_id = 'pet-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "pet_photos_auth_delete" on storage.objects for delete
  using (bucket_id = 'pet-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Provider photos: public read, provider upload
create policy "provider_photos_public_read" on storage.objects for select
  using (bucket_id = 'provider-photos');
create policy "provider_photos_auth_upload" on storage.objects for insert
  with check (bucket_id = 'provider-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "provider_photos_auth_delete" on storage.objects for delete
  using (bucket_id = 'provider-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Check-in photos: authenticated users in order context
create policy "checkin_photos_auth_read" on storage.objects for select
  using (bucket_id = 'check-in-photos' and auth.role() = 'authenticated');
create policy "checkin_photos_auth_upload" on storage.objects for insert
  with check (bucket_id = 'check-in-photos' and auth.role() = 'authenticated');

-- Chat media: authenticated users
create policy "chat_media_auth_read" on storage.objects for select
  using (bucket_id = 'chat-media' and auth.role() = 'authenticated');
create policy "chat_media_auth_upload" on storage.objects for insert
  with check (bucket_id = 'chat-media' and auth.role() = 'authenticated');

-- Review photos: public read, authenticated upload
create policy "review_photos_public_read" on storage.objects for select
  using (bucket_id = 'review-photos');
create policy "review_photos_auth_upload" on storage.objects for insert
  with check (bucket_id = 'review-photos' and auth.role() = 'authenticated');
