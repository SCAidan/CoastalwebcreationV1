# Coastal Web Works setup

The website runs on Cloudflare Pages with Functions for /api/*. The public site is blue and white; the owner workspace and customer portal require verified sign-in to load private data.

## Existing production configuration

Cloudflare Pages: framework None, build command `npm run build`, output directory `dist`. Do not deploy the repository root. Ensure Pages Functions are deployed, not just static files. Environment variables: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, OWNER_USER_ID. Optional owner AI also needs OPENAI_API_KEY and OPENAI_MODEL. Keep secrets in Cloudflare environment settings; never commit service-role or OpenAI keys.

The existing owner tables, RLS policies and AI quota function are in `setup/schema.sql`. Do not rerun old setup scripts against an already configured project without reviewing them. The additive customer schema is `setup/client-portal.sql`; it has already been applied to the connected project. The runtime and customer onboarding instructions are in [setup/CLIENT_PORTAL.md](setup/CLIENT_PORTAL.md).

Leave Supabase public signup disabled. The owner UUID in database policies must match OWNER_USER_ID in Cloudflare. This deployment uses the existing owner account; no new owner credentials are created.

## Sign in and manage customers

Use `/login/?owner=1` with your existing owner credentials. Sign-in takes you to `/dashboard/`. The public Client login link opens only `/login/`; verified customers land at `/portal/` after sign-in. Client accounts cannot access owner CRM or financial records.

Open **Clients & inquiries** to read website submissions, create invite-only client access, assign projects and reply to change requests. Account setup links are generated without sending email; share each private link directly with the intended client. See the portal guide for details and custom-domain configuration.

## Owner assistant and backups

Supported commands include:

- Add Coastal Painting as a lead and remind me to call Friday
- Add task Review homepage by Friday
- Log a call with Coastal Painting notes: Left voicemail
- Set follow-up for Coastal Painting on Friday

Commands prepare an editable draft. Only Confirm & save writes a record. No calls, emails, payments or invoices are sent. Ambiguous business names require manual review. Weekdays use the device’s local calendar; check extracted dates before saving.

Optional AI answers use saved cloud records and selected fields only. Emails, phone numbers, URLs and free-form notes are omitted from the workspace snapshot. Questions and included text are still sent as entered; avoid sensitive information. The endpoint requests store:false; provider retention still follows applicable settings and terms. The database limits AI requests to 10 per minute per owner; this is not a monthly spending cap.

Export JSON backups regularly from Settings & backup. Imports replace the current owner workspace after confirmation. Older browser-local preview data is preserved but is not loaded automatically. Private records and sign-in tokens are not saved in localStorage by this version. Concurrent writes are rejected if another device or an inquiry import changed the workspace; export unsaved changes before reloading.

Money tracking is a simple cash ledger, not accounting or payment processing. Project balances still match business names; verify manually when one client has multiple projects. Quoted work and monthly care plans are not received income.

## Development and verification

Use Node 22.13+ or 24. Run `npm test` for server/assistant checks. Run `npm run dev` for a static preview; authentication requires the Cloudflare runtime. `npm run demo` enables synthetic local fixtures only, with `/__demo/client` and `/__demo/owner` for layout checks. Never use this local demo server as a production server. Production Pages routing never loads this fixture module.

Validate the Functions bundle with `npx wrangler pages functions build functions`. On the Cloudflare preview, test owner login/logout, customer setup and request/reply, and a contact form submission before onboarding real customers. RLS isolation was also checked in rollback-only transactions against the connected database.

## Security verification

Read [the security audit](audits/security-audit-2026-10-26.md). Run `npm ci --ignore-scripts`, `npm test`, `npm run check:secrets`, `npm run build`, `npm run check:release` and `npm run check:worker`. The same checks run in the repository security workflow. Require that check before merging. Only `dist` is the public release; `.artifacts` contains private build evidence and must never be deployed.

After deployment, run `npm run check:deployment -- <verified HTTPS origin>` to inspect public payloads, forbidden paths, security headers and anonymous API responses. No login, payment or private-row fetch is performed by that script.

## Interim PayPal payments

The public footer and client portal link to `/pay/`. The link and QR match the code supplied by Aidan. It is an app-oriented QR URL, so desktop visitors can scan it with the PayPal app. Use Goods & Services for business payments. Receipt and ledger reconciliation are manual. Nothing in this integration saves cards, verifies a completed payment, or authorizes recurring billing. A PayPal.Me or seller checkout URL can replace the app link later.
