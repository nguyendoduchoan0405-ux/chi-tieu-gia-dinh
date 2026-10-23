-- Chạy 1 lần trong Supabase > SQL Editor (dán toàn bộ rồi bấm Run).
-- Thiết kế: dữ liệu dùng chung cho cả nhà; chỉ email trong bảng members mới đọc/ghi được.

create table if not exists members (
  email text primary key
);

create table if not exists expenses (
  id         text primary key,               -- id tạo ở app (cùng id trên mọi máy)
  noi_dung   text not null default '',
  so_tien    bigint not null default 0,
  thoi_gian  timestamptz not null default now(),
  nguon      text not null default '',       -- nguồn tiền: Vợ, Chồng, Visa...
  cau_goc    text not null default '',       -- câu nói gốc / "quét ảnh"
  xoa        boolean not null default false, -- xóa mềm, để máy kia cũng xóa theo
  nguoi_ghi  text default (auth.jwt() ->> 'email'),
  updated_at timestamptz not null default now()
);
create index if not exists expenses_updated_at on expenses (updated_at);

create table if not exists cai_dat (         -- danh sách nguồn tiền dùng chung
  khoa       text primary key,
  gia_tri    jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function dat_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists expenses_ts on expenses;
create trigger expenses_ts before insert or update on expenses for each row execute function dat_updated_at();
drop trigger if exists cai_dat_ts on cai_dat;
create trigger cai_dat_ts before insert or update on cai_dat for each row execute function dat_updated_at();

alter table members  enable row level security;
alter table expenses enable row level security;
alter table cai_dat  enable row level security;

create or replace function is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where email = lower(auth.jwt() ->> 'email'));
$$;

drop policy if exists "tv doc" on expenses;  drop policy if exists "tv them" on expenses;  drop policy if exists "tv sua" on expenses;
create policy "tv doc"  on expenses for select using (is_member());
create policy "tv them" on expenses for insert with check (is_member());
create policy "tv sua"  on expenses for update using (is_member()) with check (is_member());

drop policy if exists "tv doc" on cai_dat;  drop policy if exists "tv them" on cai_dat;  drop policy if exists "tv sua" on cai_dat;
create policy "tv doc"  on cai_dat for select using (is_member());
create policy "tv them" on cai_dat for insert with check (is_member());
create policy "tv sua"  on cai_dat for update using (is_member()) with check (is_member());

-- 2 vợ chồng (viết thường):
insert into members (email) values ('nguyendoduchoan0405@gmail.com'), ('nguyenhuynhanhthoai@gmail.com')
on conflict do nothing;
