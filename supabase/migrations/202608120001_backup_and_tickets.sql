-- 기존 Supabase 프로젝트에 유럽 여행 앱 전용 객체만 추가합니다.
-- 앱 데이터는 JSONB 백업 1행으로 관리하고, 티켓 파일 메타데이터만 별도 테이블에 보관합니다.

create extension if not exists pgcrypto;

create table if not exists public.europe_trip_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, trip_key)
);

alter table public.europe_trip_backups enable row level security;
grant select, insert, update, delete on public.europe_trip_backups to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'europe_trip_backups' and policyname = 'Europe trip users read own backups'
  ) then
    create policy "Europe trip users read own backups"
    on public.europe_trip_backups for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'europe_trip_backups' and policyname = 'Europe trip users create own backups'
  ) then
    create policy "Europe trip users create own backups"
    on public.europe_trip_backups for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'europe_trip_backups' and policyname = 'Europe trip users update own backups'
  ) then
    create policy "Europe trip users update own backups"
    on public.europe_trip_backups for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'europe_trip_backups' and policyname = 'Europe trip users delete own backups'
  ) then
    create policy "Europe trip users delete own backups"
    on public.europe_trip_backups for delete to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end
$$;

create table if not exists public.europe_trip_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  city text,
  event_date date,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  created_at timestamptz not null default now()
);

alter table public.europe_trip_tickets enable row level security;
grant select, insert, update, delete on public.europe_trip_tickets to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'europe_trip_tickets' and policyname = 'Europe trip users read own tickets'
  ) then
    create policy "Europe trip users read own tickets"
    on public.europe_trip_tickets for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'europe_trip_tickets' and policyname = 'Europe trip users create own tickets'
  ) then
    create policy "Europe trip users create own tickets"
    on public.europe_trip_tickets for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'europe_trip_tickets' and policyname = 'Europe trip users delete own tickets'
  ) then
    create policy "Europe trip users delete own tickets"
    on public.europe_trip_tickets for delete to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'europe-trip-tickets',
  'europe-trip-tickets',
  false,
  20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Europe trip users upload own ticket files'
  ) then
    create policy "Europe trip users upload own ticket files"
    on storage.objects for insert to authenticated
    with check (
      bucket_id = 'europe-trip-tickets'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Europe trip users read own ticket files'
  ) then
    create policy "Europe trip users read own ticket files"
    on storage.objects for select to authenticated
    using (
      bucket_id = 'europe-trip-tickets'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Europe trip users delete own ticket files'
  ) then
    create policy "Europe trip users delete own ticket files"
    on storage.objects for delete to authenticated
    using (
      bucket_id = 'europe-trip-tickets'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    );
  end if;
end
$$;
