-- 露營助手：Supabase Free 專案保活
-- 請在 Supabase Dashboard → SQL Editor 執行一次。
-- 此 RPC 不接觸行程或帳號資料；它只更新一筆系統維護時間戳。

create table if not exists public.camp_system_maintenance (
  singleton boolean primary key default true check (singleton),
  last_keepalive_at timestamptz not null default now()
);

alter table public.camp_system_maintenance enable row level security;
revoke all on table public.camp_system_maintenance from public, anon, authenticated;

create or replace function public.camp_v8_keepalive()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  checked_at timestamptz;
begin
  insert into public.camp_system_maintenance (singleton, last_keepalive_at)
  values (true, clock_timestamp())
  on conflict (singleton) do update
    set last_keepalive_at = excluded.last_keepalive_at
  returning last_keepalive_at into checked_at;
  return checked_at;
end;
$$;

revoke all on function public.camp_v8_keepalive() from public, anon, authenticated;
grant execute on function public.camp_v8_keepalive() to service_role;
