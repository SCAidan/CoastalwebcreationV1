-- Additive client portal. Existing owner workspace and its policies are unchanged.
create table public.client_accounts (
 id uuid primary key,
 business_name text not null check(length(business_name) between 1 and 160),
 email text not null check(length(email) between 3 and 254),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.portal_projects (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.client_accounts(id),
 name text not null check(length(name) between 1 and 160),
 status text not null default 'Discovery' check(status in ('Discovery','Design','Review','Ready to launch','Launched','On hold')),
 next_step text not null default '' check(length(next_step)<=2000),
 due_date date,
 website_url text not null default '' check(length(website_url)<=500),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.portal_projects(client_id);
create table public.portal_requests (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.portal_projects(id),
 title text not null check(length(title) between 1 and 160),
 body text not null check(length(body) between 1 and 4000),
 status text not null default 'New' check(status in ('New','In progress','Waiting for you','Completed')),
 owner_reply text not null default '' check(length(owner_reply)<=4000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.portal_requests(project_id);
create table public.website_inquiries (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 120),
 email text not null check(length(email) between 3 and 254),
 business text not null default '' check(length(business)<=160),
 service text not null default 'unsure' check(service in ('unsure','new','refresh','care')),
 style text not null default 'unsure' check(style in ('unsure','restaurant','professional')),
 message text not null check(length(message) between 1 and 3000),
 status text not null default 'New' check(status in ('New','Contacted','Converted','Archived')),
 linked_lead text,
 created_at timestamptz not null default now()
);
create table public.agency_intake_limits (bucket text primary key,requests integer not null default 1,created_at timestamptz not null default now());

alter table public.client_accounts enable row level security;
alter table public.portal_projects enable row level security;
alter table public.portal_requests enable row level security;
alter table public.website_inquiries enable row level security;
alter table public.agency_intake_limits enable row level security;
revoke all on public.client_accounts,public.portal_projects,public.portal_requests,public.website_inquiries,public.agency_intake_limits from anon,authenticated;
grant select,insert,update on public.client_accounts,public.portal_projects,public.website_inquiries to authenticated;
grant select on public.portal_requests to authenticated;
grant insert(project_id,title,body) on public.portal_requests to authenticated;
grant update(status,owner_reply,updated_at) on public.portal_requests to authenticated;
grant all on public.client_accounts,public.portal_projects,public.portal_requests,public.website_inquiries,public.agency_intake_limits to service_role;

create policy client_accounts_read on public.client_accounts for select to authenticated using ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid or (id=(select auth.uid()) and active));
create policy client_accounts_owner_insert on public.client_accounts for insert to authenticated with check ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid);
create policy client_accounts_owner_update on public.client_accounts for update to authenticated using ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid) with check ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid);
create policy portal_projects_read on public.portal_projects for select to authenticated using ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid or (client_id=(select auth.uid()) and exists(select 1 from public.client_accounts a where a.id=client_id and a.active)));
create policy portal_projects_owner_insert on public.portal_projects for insert to authenticated with check ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid);
create policy portal_projects_owner_update on public.portal_projects for update to authenticated using ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid) with check ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid);
create policy portal_requests_read on public.portal_requests for select to authenticated using ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid or exists(select 1 from public.portal_projects p where p.id=project_id and p.client_id=(select auth.uid())));
create policy portal_requests_insert on public.portal_requests for insert to authenticated with check (exists(select 1 from public.portal_projects p where p.id=project_id and p.client_id=(select auth.uid())));
create policy portal_requests_owner_update on public.portal_requests for update to authenticated using ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid) with check ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid);
create policy website_inquiries_owner on public.website_inquiries for all to authenticated using ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid) with check ((select auth.uid())='bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid);
-- No anon grants/policies. Public intake writes only through the constrained Edge Function.

create function public.claim_inquiry_slot(fingerprint text) returns boolean language plpgsql security invoker set search_path='' as $$
declare keys text[];limits integer[]:=array[5,20,100];i integer;
begin
 if length(fingerprint)<>64 then return false; end if;
 perform pg_advisory_xact_lock(hashtext('coastal-intake'));
 keys:=array['ip:'||fingerprint||':'||date_trunc('hour',now())::text,'minute:'||date_trunc('minute',now())::text,'day:'||date_trunc('day',now())::text];
 for i in 1..3 loop
  if coalesce((select requests from public.agency_intake_limits where bucket=keys[i]),0)>=limits[i] then return false; end if;
 end loop;
 for i in 1..3 loop insert into public.agency_intake_limits(bucket) values(keys[i]) on conflict(bucket) do update set requests=public.agency_intake_limits.requests+1;end loop;
 delete from public.agency_intake_limits where created_at<now()-interval '2 days';
 return true;
end $$;
revoke all on function public.claim_inquiry_slot(text) from public,anon,authenticated;
grant execute on function public.claim_inquiry_slot(text) to service_role;

create function public.import_website_inquiry(inquiry_id uuid) returns text language plpgsql security invoker set search_path='' as $$
declare q public.website_inquiries;w public.agency_workspaces;lead jsonb;lead_id text;
begin
 if (select auth.uid()) is distinct from 'bf6331f2-e5b7-4070-a301-443b0183c41b'::uuid then raise insufficient_privilege;end if;
 select * into q from public.website_inquiries where id=inquiry_id for update;
 if not found then raise no_data_found;end if;
 if q.linked_lead is not null then return q.linked_lead;end if;
 insert into public.agency_workspaces(owner_id,data) values(auth.uid(),'{"leads":[],"calls":[],"clients":[],"projects":[],"tasks":[],"transactions":[]}') on conflict(owner_id) do nothing;
 select * into w from public.agency_workspaces where owner_id=auth.uid() for update;
 lead_id:='web-'||q.id::text;
 lead:=jsonb_build_object('id',lead_id,'business',coalesce(nullif(q.business,''),q.name),'contact',q.name,'email',q.email,'source','Website','stage','New','value','0','notes',q.message||E'\nService: '||q.service||E'\nDesign: '||q.style);
 update public.agency_workspaces set data=jsonb_set(w.data,'{leads}',coalesce(w.data->'leads','[]'::jsonb)||jsonb_build_array(lead)),revision=w.revision+1,updated_at=now() where owner_id=auth.uid();
 update public.website_inquiries set status='Converted',linked_lead=lead_id where id=q.id;
 return lead_id;
end $$;
revoke all on function public.import_website_inquiry(uuid) from public,anon;
grant execute on function public.import_website_inquiry(uuid) to authenticated;
