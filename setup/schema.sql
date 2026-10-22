-- Replace YOUR_AUTH_USER_UUID with your Supabase Auth user's UUID before running.
-- Only this owner may access workspace rows. No anonymous or public reads.
begin;
create table if not exists public.agency_workspaces (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null check(jsonb_typeof(data)='object'),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
alter table public.agency_workspaces enable row level security;
revoke all on public.agency_workspaces from anon;
grant select, insert, update on public.agency_workspaces to authenticated;
create policy "owner_read" on public.agency_workspaces for select to authenticated
 using (owner_id=(select auth.uid()) and (select auth.uid())='YOUR_AUTH_USER_UUID'::uuid);
create policy "owner_insert" on public.agency_workspaces for insert to authenticated
 with check (owner_id=(select auth.uid()) and (select auth.uid())='YOUR_AUTH_USER_UUID'::uuid);
create policy "owner_update" on public.agency_workspaces for update to authenticated
 using (owner_id=(select auth.uid()) and (select auth.uid())='YOUR_AUTH_USER_UUID'::uuid)
 with check (owner_id=(select auth.uid()) and (select auth.uid())='YOUR_AUTH_USER_UUID'::uuid);
create table if not exists public.agency_ai_usage (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 window_start timestamptz not null default now(), requests integer not null default 1
);
alter table public.agency_ai_usage enable row level security;
revoke all on public.agency_ai_usage from anon;
grant select,insert,update on public.agency_ai_usage to authenticated;
create policy "owner_usage" on public.agency_ai_usage for all to authenticated
 using (owner_id=(select auth.uid()) and (select auth.uid())='YOUR_AUTH_USER_UUID'::uuid)
 with check (owner_id=(select auth.uid()) and (select auth.uid())='YOUR_AUTH_USER_UUID'::uuid);
create or replace function public.claim_ai_request() returns boolean
language plpgsql security invoker set search_path = public as $$
declare claimed uuid;
begin
 if auth.uid() is null then return false; end if;
 insert into public.agency_ai_usage as usage(owner_id, window_start, requests)
 values(auth.uid(), now(), 1)
 on conflict(owner_id) do update set
 requests = case when usage.window_start <= now()-interval '60 seconds' then 1 else usage.requests+1 end,
 window_start = case when usage.window_start <= now()-interval '60 seconds' then now() else usage.window_start end
 where usage.requests < 10 or usage.window_start <= now()-interval '60 seconds'
 returning owner_id into claimed;
 return claimed is not null;
end $$;
revoke all on function public.claim_ai_request() from public,anon;
grant execute on function public.claim_ai_request() to authenticated;
commit;
