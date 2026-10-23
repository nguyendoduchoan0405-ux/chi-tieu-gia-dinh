-- Chạy 1 lần trong Supabase > SQL Editor.
-- Thiết kế: 1 bảng chi tiêu dùng chung cho cả nhà; chỉ email trong bảng members mới đọc/ghi được.

create table if not exists members (
  email text primary key
);

create table if not exists expenses (
  id         uuid primary key default gen_random_uuid(),
  noi_dung   text not null,
  so_tien    bigint not null default 0,
  cau_goc    text,                          -- câu nói gốc, để đối chiếu khi tách sai
  thoi_gian  timestamptz not null default now(),
  nguoi_ghi  text default auth.email()      -- ai ghi khoản này
);

alter table members  enable row level security;
alter table expenses enable row level security;

create or replace function is_member() returns boolean
language sql stable security definer as $$
  select exists (select 1 from members where email = auth.email());
$$;

create policy "thanh vien doc"  on expenses for select using (is_member());
create policy "thanh vien them" on expenses for insert with check (is_member());
create policy "thanh vien sua"  on expenses for update using (is_member());
create policy "thanh vien xoa"  on expenses for delete using (is_member());

-- Thay bằng email thật của 2 vợ chồng:
-- insert into members (email) values ('chong@example.com'), ('vo@example.com');
