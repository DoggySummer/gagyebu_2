-- 2026-08-09: 순자산/계좌 관리 기능 — accounts, net_worth_snapshots
-- Supabase Studio > SQL Editor 에 그대로 붙여넣어 실행한다.

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  institution text check (institution is null or char_length(institution) between 1 and 100),
  category text not null check (category in (
    '현금성자산', '투자자산', '은퇴자산', '사용자산',
    '카드대출', '신용대출', '주거관련대출', '담보대출', '기타대출'
  )),
  balance integer not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);

alter table public.accounts enable row level security;

create policy "accounts_select_own" on public.accounts
  for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts
  for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "accounts_delete_own" on public.accounts
  for delete using (auth.uid() = user_id);

create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  asset_total integer not null default 0,
  liability_total integer not null default 0,
  net_worth integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create index net_worth_snapshots_user_id_idx on public.net_worth_snapshots (user_id);

alter table public.net_worth_snapshots enable row level security;

create policy "net_worth_snapshots_select_own" on public.net_worth_snapshots
  for select using (auth.uid() = user_id);
create policy "net_worth_snapshots_insert_own" on public.net_worth_snapshots
  for insert with check (auth.uid() = user_id);
create policy "net_worth_snapshots_update_own" on public.net_worth_snapshots
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "net_worth_snapshots_delete_own" on public.net_worth_snapshots
  for delete using (auth.uid() = user_id);

-- updated_at 자동 갱신. 이미 같은 이름의 함수가 있다면 동일 로직으로 덮어써도 안전하다.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

create trigger net_worth_snapshots_set_updated_at
  before update on public.net_worth_snapshots
  for each row execute function public.set_updated_at();
