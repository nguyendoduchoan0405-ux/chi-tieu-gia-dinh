-- Chạy 1 lần trong Supabase > SQL Editor: thêm lưu ảnh hóa đơn (kho riêng tư, chỉ thành viên dùng được).
alter table expenses add column if not exists co_anh boolean not null default false;

insert into storage.buckets (id, name, public) values ('hoa-don', 'hoa-don', false) on conflict (id) do nothing;

drop policy if exists "hoa-don doc"  on storage.objects;
drop policy if exists "hoa-don them" on storage.objects;
drop policy if exists "hoa-don sua"  on storage.objects;
drop policy if exists "hoa-don xoa"  on storage.objects;
create policy "hoa-don doc"  on storage.objects for select using (bucket_id = 'hoa-don' and public.is_member());
create policy "hoa-don them" on storage.objects for insert with check (bucket_id = 'hoa-don' and public.is_member());
create policy "hoa-don sua"  on storage.objects for update using (bucket_id = 'hoa-don' and public.is_member());
create policy "hoa-don xoa"  on storage.objects for delete using (bucket_id = 'hoa-don' and public.is_member());
