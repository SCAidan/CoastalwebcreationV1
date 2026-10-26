# Client portal verification

- 41 automated tests pass: existing assistant/actions plus session cookies, verified roles, CSRF, expired/inactive access, forged request fields, optimistic concurrency and gateway validation.
- Cloudflare Pages Functions compiled using Wrangler 4.46.0.
- Rollback-only database checks also verified idempotent inquiry imports, CRM revision increments, and the hourly inquiry cap.
- Actual Supabase RLS tested with two synthetic client UUIDs in a rollback-only transaction: separate accounts/projects, cross-client insert denial, status/reply forgery denial, owner access, paused access, anonymous denial and no owner-workspace/inquiry visibility for clients. Fixtures were rolled back.
- Supabase gateway deployed ACTIVE; a live invalid inquiry returns 400 before any record is written.
- Desktop synthetic browser flow: submit client request, see saved request, owner status/reply update, and owner legacy dashboard loading.
- Mobile customer portal checked at 375px content width: no horizontal overflow. Request form precedes request history on small screens.
- No real client accounts or invitations were created or sent. Complete real owner/password and client activation checks on the Cloudflare preview; these require the account holder.
- Security advisor: intentional INFO for no policies on service-only intake limiter. Existing WARN for leaked-password protection disabled; enable in Supabase Auth if available on the plan. Performance advisor reports a new unused request FK index, expected before traffic; keep it for project filtering.
