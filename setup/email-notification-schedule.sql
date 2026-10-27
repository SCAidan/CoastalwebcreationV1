-- Run after deploying notification-dispatch with its custom scheduler authentication.
-- Set the URL to this project's notification-dispatch URL before running.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
select vault.create_secret('https://aoadwygtjzctjhdovbds.supabase.co/functions/v1/notification-dispatch','coastal_notification_url');
select cron.schedule('coastal-email-notifications','* * * * *',$job$
 select net.http_post(
  url:=(select decrypted_secret from vault.decrypted_secrets where name='coastal_notification_url'),
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='coastal_notification_auth')),
  body:='{}'::jsonb,timeout_milliseconds:=60000
 ) where exists(select 1 from coastal_private.email_settings where enabled)
   and exists(select 1 from public.notification_outbox where status in ('pending','sending'));
$job$);
-- Enable only after verifying the worker's configuration and SQL security checks.
-- update coastal_private.email_settings set enabled=true;
