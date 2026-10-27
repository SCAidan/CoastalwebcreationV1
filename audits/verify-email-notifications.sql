-- Transactional verification: no customer fixtures or email jobs are committed.
begin;
update coastal_private.email_settings set enabled=true,cooldown_until=now();
do $$
declare client uuid:=gen_random_uuid(); project uuid:=gen_random_uuid(); request_id uuid; inquiry uuid; n integer; job public.notification_outbox;
begin
 if has_table_privilege('anon','public.notification_outbox','SELECT') or
    has_table_privilege('authenticated','public.notification_outbox','INSERT') or
    has_table_privilege('authenticated','public.notification_outbox','SELECT') or
    has_function_privilege('authenticated','public.claim_notification_jobs()','EXECUTE') or
    has_function_privilege('anon','public.notification_dispatch_settings()','EXECUTE') or
    has_function_privilege('authenticated','public.finish_notification_job(uuid,uuid,text,text)','EXECUTE') or
    has_schema_privilege('authenticated','coastal_private','USAGE') then
  raise exception 'notification privileges are too broad';
 end if;
 insert into public.client_accounts(id,business_name,email) values(client,'Notification verification','sales@coastalwebwork.com');
 insert into public.portal_projects(client_id,name) values(client,'Notification verification') returning id into project;
 insert into public.website_inquiries(name,email,message) values('Notification verification','sales@coastalwebwork.com','Transactional fixture') returning id into inquiry;
 -- Exercise the actual client role and RLS insert, including the private trigger.
 perform set_config('request.jwt.claims',jsonb_build_object('sub',client,'role','authenticated')::text,true);
 set local role authenticated;
 insert into public.portal_requests(project_id,title,body) values(project,'Notification verification','Transactional fixture') returning id into request_id;
 reset role;
 update public.portal_requests set status='Completed',owner_reply='Verification reply' where id=request_id;
 select count(*) into n from public.notification_outbox where source_id in (inquiry,request_id);
 if n<>4 then raise exception 'expected four event emails, got %',n; end if;
 if exists(select 1 from public.notification_outbox where source_id in(inquiry,request_id) and payload->>'to'<>'sales@coastalwebwork.com') then raise exception 'unexpected recipient'; end if;
 update public.portal_requests set status='Completed',owner_reply='Verification reply' where id=request_id;
 select count(*) into n from public.notification_outbox where source_id in(inquiry,request_id);
 if n<>4 then raise exception 'unchanged reply queued duplicate'; end if;
 if exists(select 1 from public.notification_outbox where source_id=request_id and kind='request_update' and payload->>'text' like '%Verification reply%') then raise exception 'private reply included in email'; end if;
 update public.client_accounts set active=false where id=client;
 update public.portal_requests set status='New' where id=request_id;
 select count(*) into n from public.notification_outbox where source_id in(inquiry,request_id);
 if n<>4 then raise exception 'inactive account got an email'; end if;
 select * into job from public.claim_notification_jobs() where source_id in(inquiry,request_id) limit 1;
 if job.status<>'sending' or job.claim_token is null then raise exception 'claim failed'; end if;
 if public.finish_notification_job(job.id,gen_random_uuid(),'sent','fixture') then raise exception 'incorrect lease accepted'; end if;
 if not public.finish_notification_job(job.id,job.claim_token,'sent','fixture') then raise exception 'valid lease rejected'; end if;
 if exists(select 1 from public.notification_outbox where id=job.id and (status<>'sent' or payload<>'{}'::jsonb)) then raise exception 'successful payload not cleared'; end if;
end $$;
rollback;
