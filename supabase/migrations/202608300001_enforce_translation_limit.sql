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
  if p_char_count <= 0 then
    raise exception 'Character count must be positive';
  end if;

  if p_char_count > 500000 then
    raise exception 'MONTHLY_TRANSLATION_LIMIT_EXCEEDED';
  end if;

  insert into public.europe_trip_translation_usage (user_id, usage_month, char_count)
  values (p_user_id, p_usage_month, p_char_count)
  on conflict (user_id, usage_month) do update
    set char_count = public.europe_trip_translation_usage.char_count + excluded.char_count,
        updated_at = now()
    where public.europe_trip_translation_usage.char_count + excluded.char_count <= 500000
  returning char_count into new_count;

  if new_count is null then
    raise exception 'MONTHLY_TRANSLATION_LIMIT_EXCEEDED';
  end if;

  return new_count;
end;
$$;

revoke all on function public.increment_europe_trip_translation_usage(uuid, date, integer) from public, anon, authenticated;
grant execute on function public.increment_europe_trip_translation_usage(uuid, date, integer) to service_role;
