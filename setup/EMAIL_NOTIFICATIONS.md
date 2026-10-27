# Website email notifications

The Supabase database queues transactional email after a successful inquiry or portal request write. A scheduled `notification-dispatch` Edge Function checks the queue each minute and sends through Resend. Existing Cloudflare API routes, gateway intake validation, RLS policies, login, origin checks and payment behavior are unchanged.

## Messages

| Event | Recipient | Content |
| --- | --- | --- |
| Saved website inquiry | sales@coastalwebwork.com | Name, business, customer email, selected service/design and message; reply goes to customer. |
| Saved website inquiry | Submitted customer email | Fixed receipt confirmation; reply goes to sales. User-supplied message text is not echoed. |
| New portal change request | sales@coastalwebwork.com | Client, project, title and request; reply goes to the saved client email. |
| Changed request status or owner reply | Active assigned client | Status and link to sign in; private replies remain in the portal. Identical saves produce no new alert. |

Sender: `Coastal Web Works <updates@notify.coastalwebwork.com>`. This is a sending address, not another Gmail mailbox. Customer replies go to `sales@coastalwebwork.com`. No marketing, invitation, password-reset or payment emails are introduced.

## Deployment

1. Verify `notify.coastalwebwork.com` in Resend and create a sending-only key restricted to that domain.
2. In the CoastalWebWorks Supabase project, save `RESEND_API_KEY` under Edge Functions → Secrets. Never put it in source, browser code, Cloudflare public assets, screenshots or chat.
3. Apply `email-notifications.sql` after the existing portal schema. It creates an RLS-protected, service-only outbox and private triggers. It generates a random scheduler credential inside Vault; the credential is never returned by setup SQL.
4. Deploy `setup/functions/notification-dispatch/index.ts` as `notification-dispatch`. Set `verify_jwt=false` because the worker performs its own authentication: a 256-bit scheduler token checked against its SHA-256 digest. Only the scheduler has this token. It is unrelated to customer login or the public inquiry action.
5. Apply `email-notification-schedule.sql`, using the current project URL. This enables pg_net/pg_cron and schedules the worker every minute, only when jobs exist and sending is enabled. Do not rerun one-time setup scripts blindly.
6. Run `audits/verify-email-notifications.sql`. It checks actual database grants, client-role inserts, four trigger events, no-change suppression, paused accounts and lease handling, then rolls all fixtures back.
7. Test the worker through pg_net using the Vault credential while settings are disabled. Its response should be `configured:true, enabled:false`. Enable with `update coastal_private.email_settings set enabled=true;` only after checks pass.
8. For the custom domain, the existing `agency-gateway` requires Supabase secret `SITE_ORIGIN=https://coastalwebwork.com`. The backend currently supports one exact custom origin. Redirect www traffic to the apex using Cloudflare, or use the apex for forms and account provisioning. Do not weaken origin checks or add wildcard custom origins.
9. Submit a clearly marked test on the live website; confirm database receipt, Resend acceptance, and inbox arrival for both owner and customer messages. Test portal request and reply alerts using a deliberate test client. Production acceptance is not proof of inbox delivery.

## Reliability and limits

- Queue writes are transactional with saved records. A rejected/rolled-back inquiry or request creates no email. No historical records are backfilled when enabling this feature.
- The queue is inaccessible to anonymous and signed-in browser roles. The RPCs are service-role only. Triggers run with elevated privileges solely to create notifications from already-authorized writes; their functions are private and cannot be invoked by users.
- Jobs use a five-minute lease, a unique claim token, `FOR UPDATE SKIP LOCKED`, and Resend idempotency keys. Retries keep the same payload and key. Successful sends clear queued personal content, retaining IDs and status for operations.
- The worker sends at most five jobs per run and spaces requests by 600 ms. Temporary errors back off; rate limiting pauses sending globally for one hour. No provider response content, recipient information or secrets appear in worker responses/logs.
- After eight attempts or 23 hours, unsuccessful/ambiguous jobs stop for manual review. This stays inside Resend's 24-hour idempotency window; do not blindly replay old jobs with a new ID. Missing a completion response can still require reconciliation with provider logs.
- Free Resend limits apply to individual emails, not form submissions. Each inquiry uses two messages; portal alerts also count. Quota exhaustion can delay or prevent notifications. Keep checking the saved dashboard, especially during initial rollout.
- `sent` means the provider accepted the send, not delivered/read. Check Resend for bounces and delivery events; this release does not add a delivery webhook or automatic bounce processing.

## Operations and rollback

Inspect `notification_outbox` from the Supabase SQL Editor using only `kind,status,attempts,last_error,provider_id,sent_at` unless content is needed for a specific investigation. No new dashboard UI is added. Investigate `failed` jobs and do not expose this table through browser grants. Queue metadata is retained until deliberately cleaned up; inquiry and project retention remain unchanged.

Pause new queue entries and sending immediately:

```sql
update coastal_private.email_settings set enabled=false;
```

The existing form and portal still save records normally while notifications are paused. Do not delete existing customer records to troubleshoot email. To resume, resolve configuration/provider problems first; jobs outside the retry window need review rather than automatic replay. The existing gateway deployment is unchanged.

Live deployment: October 26, 2026. Confirm final inbox arrival and custom-domain form verification in the business launch checklist before marking its notification item complete.
