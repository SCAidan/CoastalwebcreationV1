-- Additive notification queue. Run once after client-portal.sql.
-- No existing API, auth, origin policy, or customer record is changed.
begin;
create schema if not exists coastal_private;
revoke all on schema coastal_private from public, anon, authenticated;

create table coastal_private.email_settings (
 singleton boolean primary key default true check(singleton),
 enabled boolean not null default false,
 token_hash text not null,
 cooldown_until timestamptz not null default now()
);
revoke all on coastal_private.email_settings from public,anon,authenticated;
alter table coastal_private.email_settings enable row level security;

create table public.notification_outbox (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('inquiry_owner','inquiry_confirmation','request_owner','request_update')),
 source_id uuid not null,
 payload jsonb not null,
 status text not null default 'pending' check(status in ('pending','sending','sent','failed')),
 attempts integer not null default 0,
 created_at timestamptz not null default now(),
 available_at timestamptz not null default now(),
 lease_until timestamptz,
 claim_token uuid,
 provider_id text,
 last_error text,
 sent_at timestamptz
);
create index notification_outbox_pending on public.notification_outbox(available_at) where status in ('pending','sending');
alter table public.notification_outbox enable row level security;
revoke all on public.notification_outbox from public,anon,authenticated;
grant all on public.notification_outbox to service_role;

-- Only triggers create jobs. Recipients are derived from saved records, never an email-send API.
create function coastal_private.queue_notification() returns trigger
language plpgsql security definer set search_path='' as $$
declare p public.portal_projects; a public.client_accounts; msg jsonb;
begin
 if not exists(select 1 from coastal_private.email_settings where enabled) then return new; end if;
 if tg_table_name='website_inquiries' then
  insert into public.notification_outbox(kind,source_id,payload) values
  ('inquiry_owner',new.id,jsonb_build_object(
   'to','sales@coastalwebwork.com','reply_to',new.email,
   'subject','New website inquiry | Coastal Web Works',
   'text','New website inquiry'||E'\n\nName: '||new.name||E'\nEmail: '||new.email||E'\nBusiness: '||new.business||E'\nService: '||case new.service when 'new' then 'A new website' when 'refresh' then 'A website refresh' when 'care' then 'Ongoing website care' else 'Let’s figure it out together' end||E'\nDesign direction: '||new.style||E'\n\n'||new.message||E'\n\nView inquiries: https://coastalwebwork.com/dashboard/')),
  ('inquiry_confirmation',new.id,jsonb_build_object(
   'to',new.email,'reply_to','sales@coastalwebwork.com',
   'subject','We received your website inquiry | Coastal Web Works',
   'text',E'Thanks for contacting Coastal Web Works. Your website inquiry has been received. Aidan will review it and get back to you.\n\nYou can reply to this email or contact sales@coastalwebwork.com.\n(831) 521-9681\nhttps://coastalwebwork.com\n\nIf you did not submit an inquiry, you can ignore this confirmation.'));
 else
  select * into p from public.portal_projects where id=new.project_id;
  select * into a from public.client_accounts where id=p.client_id and active;
  if not found then return new; end if;
  if tg_op='INSERT' then
   insert into public.notification_outbox(kind,source_id,payload) values
   ('request_owner',new.id,jsonb_build_object(
    'to','sales@coastalwebwork.com','reply_to',a.email,
    'subject','New client change request | Coastal Web Works',
    'text','Client: '||a.business_name||E'\nEmail: '||a.email||E'\nProject: '||p.name||E'\nRequest: '||new.title||E'\n\n'||new.body||E'\n\nView requests: https://coastalwebwork.com/dashboard/'));
  elsif new.status is distinct from old.status or new.owner_reply is distinct from old.owner_reply then
   -- Private replies stay in the authenticated portal, never in the notification email.
   insert into public.notification_outbox(kind,source_id,payload) values
   ('request_update',new.id,jsonb_build_object(
    'to',a.email,'reply_to','sales@coastalwebwork.com',
    'subject','Your website request has an update | Coastal Web Works',
    'text','Your website change request has been updated.'||E'\nStatus: '||new.status||E'\n\nSign in to view the request and any response:\nhttps://coastalwebwork.com/portal/\n\nQuestions? Reply to sales@coastalwebwork.com.'));
  end if;
 end if;
 return new;
end $$;
revoke all on function coastal_private.queue_notification() from public,anon,authenticated;
create trigger queue_inquiry_emails after insert on public.website_inquiries for each row execute function coastal_private.queue_notification();
create trigger queue_request_emails after insert or update of status,owner_reply on public.portal_requests for each row execute function coastal_private.queue_notification();

-- Restricted RPCs: even the website owner JWT cannot read or invoke these.
create function public.notification_dispatch_settings() returns jsonb
language sql security definer set search_path='' as $$
 select jsonb_build_object('enabled',enabled,'token_hash',token_hash) from coastal_private.email_settings where singleton
$$;
create function public.claim_notification_jobs() returns setof public.notification_outbox
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from coastal_private.email_settings where enabled and cooldown_until<=now()) then return; end if;
 -- Stay inside Resend's 24-hour idempotency window; ambiguous older jobs need manual review.
 update public.notification_outbox set status='failed',last_error='retry_window_expired',claim_token=null,lease_until=null
 where status in ('pending','sending') and created_at<now()-interval '23 hours';
 update public.notification_outbox set status='failed',last_error='attempts_exhausted',claim_token=null,lease_until=null
 where status='sending' and lease_until<now() and attempts>=8;
 return query
 with jobs as (
  select id from public.notification_outbox
  where ((status='pending' and available_at<=now()) or (status='sending' and lease_until<now()))
    and attempts<8
  order by created_at for update skip locked limit 5
 )
 update public.notification_outbox q set status='sending',attempts=attempts+1,
  lease_until=now()+interval '5 minutes',claim_token=gen_random_uuid()
 from jobs where q.id=jobs.id returning q.*;
end $$;
create function public.finish_notification_job(job_id uuid, lease_token uuid, outcome text, message_id text default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
 if outcome not in ('sent','retry','rate_limited','permanent_failure') then raise exception 'invalid outcome'; end if;
 update public.notification_outbox set
  status=case when outcome='sent' then 'sent' when outcome='permanent_failure' or attempts>=8 then 'failed' else 'pending' end,
  provider_id=case when outcome='sent' then left(message_id,200) else provider_id end,
  sent_at=case when outcome='sent' then now() else sent_at end,
  payload=case when outcome='sent' then '{}'::jsonb else payload end,
  last_error=case when outcome='sent' then null else outcome end,
  available_at=now()+least(interval '2 hours',interval '5 minutes'*power(2,least(attempts,5))),
  lease_until=null,claim_token=null
 where id=job_id and claim_token=lease_token and status='sending';
 get diagnostics changed=row_count;
 if changed=1 and outcome='rate_limited' then
  update coastal_private.email_settings set cooldown_until=now()+interval '1 hour';
 end if;
 return changed=1;
end $$;
revoke all on function public.notification_dispatch_settings() from public,anon,authenticated;
revoke all on function public.claim_notification_jobs() from public,anon,authenticated;
revoke all on function public.finish_notification_job(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.notification_dispatch_settings(),public.claim_notification_jobs(),public.finish_notification_job(uuid,uuid,text,text) to service_role;

-- Generate a scheduler credential inside the database. It never appears in source or query output.
do $$
declare dispatch_token text:=encode(extensions.gen_random_bytes(32),'hex');
begin
 perform vault.create_secret(dispatch_token,'coastal_notification_auth');
 insert into coastal_private.email_settings(token_hash) values(encode(extensions.digest(dispatch_token,'sha256'),'hex'));
end $$;
commit;
