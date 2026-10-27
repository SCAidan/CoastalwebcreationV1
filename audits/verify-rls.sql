-- Run as database administrator. All synthetic records are rolled back.
begin;
insert into public.client_accounts(id,business_name,email) values
('a1111111-1111-4111-8111-111111111111','SECURITY QA A','a@example.test'),
('a2222222-2222-4222-8222-222222222222','SECURITY QA B','b@example.test');
insert into public.portal_projects(id,client_id,name) values
('a3333333-3333-4333-8333-333333333333','a1111111-1111-4111-8111-111111111111','SECURITY QA A'),
('a4444444-4444-4444-8444-444444444444','a2222222-2222-4222-8222-222222222222','SECURITY QA B');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
do $$ declare n integer;begin
 select count(*) into n from public.client_accounts;assert n=1,'Account isolation';
 select count(*) into n from public.portal_projects;assert n=1,'Project isolation';
 select count(*) into n from public.agency_workspaces;assert n=0,'Owner workspace isolation';
 select count(*) into n from public.website_inquiries;assert n=0,'Inquiry isolation';
 insert into public.portal_requests(project_id,title,body) values('a3333333-3333-4333-8333-333333333333','SECURITY QA','Own project');
 begin insert into public.portal_requests(project_id,title,body) values('a4444444-4444-4444-8444-444444444444','SECURITY QA','Other project');raise exception 'Cross-client insert accepted';exception when insufficient_privilege then null;end;
 begin insert into public.portal_requests(project_id,title,body,status) values('a3333333-3333-4333-8333-333333333333','SECURITY QA','Forged status','Completed');raise exception 'Forged column accepted';exception when insufficient_privilege then null;end;
 update public.portal_requests set owner_reply='Forged';get diagnostics n=row_count;assert n=0,'Client reply update accepted';
end $$;
reset role;
update public.client_accounts set active=false where id='a1111111-1111-4111-8111-111111111111';
set local role authenticated;
do $$ declare n integer;begin select count(*) into n from public.portal_projects;assert n=0,'Paused account project access';select count(*) into n from public.portal_requests;assert n=0,'Paused account request access';end $$;
select set_config('request.jwt.claim.sub','a2222222-2222-4222-8222-222222222222',true);
do $$ declare n integer;begin select count(*) into n from public.portal_requests;assert n=0,'Second client sees first request';end $$;
select set_config('request.jwt.claim.sub','bf6331f2-e5b7-4070-a301-443b0183c41b',true);
do $$ declare n integer;begin select count(*) into n from public.portal_projects where id in('a3333333-3333-4333-8333-333333333333','a4444444-4444-4444-8444-444444444444');assert n=2,'Owner management access';end $$;
reset role;
set local role anon;
do $$ begin begin perform 1 from public.portal_projects;raise exception 'Anonymous read accepted';exception when insufficient_privilege then null;end;end $$;
reset role;
rollback;
select 'PASS: tenant separation, blocked forged writes, paused access and anonymous denial; fixtures rolled back' as result;
