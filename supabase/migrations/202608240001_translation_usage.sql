create table if not exists public.europe_trip_translation_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_month date not null,
  char_count bigint not null default 0 check (char_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_month)
);

alter table public.europe_trip_translation_usage enable row level security;
grant select on public.europe_trip_translation_usage to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'europe_trip_translation_usage'
      and policyname = 'Europe trip users read own translation usage'
  ) then
    create policy "Europe trip users read own translation usage"
    on public.europe_trip_translation_usage for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end
$$;

create or replace function public.increment_europe_trip_translation_usage(
  p_user_id uuid,
  p_usage_month date,
  p_char_count integer
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  if p_char_count < 0 then
    raise exception 'Character count must be non-negative';
  end if;

  insert into public.europe_trip_translation_usage (user_id, usage_month, char_count)
  values (p_user_id, p_usage_month, p_char_count)
  on conflict (user_id, usage_month) do update
    set char_count = public.europe_trip_translation_usage.char_count + excluded.char_count,
        updated_at = now()
  returning char_count into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_europe_trip_translation_usage(uuid, date, integer) from public, anon, authenticated;
grant execute on function public.increment_europe_trip_translation_usage(uuid, date, integer) to service_role;
