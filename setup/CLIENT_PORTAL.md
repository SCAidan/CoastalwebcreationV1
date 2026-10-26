# Login and client portal

## Deployment

The additive `client-portal.sql` migration and the `agency-gateway` Supabase Edge Function must be installed before deploying this frontend. The migration is already applied to project aoadwygtjzctjhdovbds as part of this change. It preserves the existing owner workspace.

The gateway uses its Supabase runtime's built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; never copy a service key into the website. It validates the current owner JWT for provisioning and accepts only constrained, rate-limited public inquiries. JWT gateway verification is disabled because the function implements its own authorization and public intake. Leave public Auth signup disabled.

Cloudflare Pages needs the existing SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and OWNER_USER_ID environment variables. Existing OPENAI_API_KEY and OPENAI_MODEL remain server-only. No additional Cloudflare secret is required. Preview branches must have these environment variables too. Deploy Pages Functions with the existing /api/* routes; a static file-only server cannot authenticate.

Allowed origins: https://coastalwebcreationv1.pages.dev and its Cloudflare preview subdomains. When adding a custom domain, set Supabase Edge Function secret SITE_ORIGIN to its exact HTTPS origin before using the form or generating setup links there. No wildcard custom domains are allowed. Login and private API requests must run on the same HTTPS origin; secure cookies intentionally do not work over plain HTTP.

## Owner and client workflow

1. Open /login/?owner=1 and use your existing owner email/password. Verified identity determines access; the URL cannot grant owner privileges.
2. Open **Clients & inquiries** from the owner dashboard. The Inquiries tab receives contact form submissions. **Add to owner leads** imports once and increments the CRM revision; reload another open dashboard tab before editing it. Conflicting saves are rejected rather than overwriting an import.
3. In Clients, enter a customer's business name and email. **Create account & setup link** creates invite-only access and displays a private one-use link. It does not send email. Copy and share it privately with the intended client. Never publish setup links or paste them into issues.
4. Add their project under Projects. Set a status, next step, optional target date, and HTTPS website link. Only assigned projects are visible to that client.
5. The client opens their link, chooses a password of at least 12 characters, and lands at /portal/. Later visits use /login/ with their email/password.
6. Requests appear in the owner Requests tab. Set a status and a customer-visible reply. The client sees it on their next page load. No email notifications are sent in this release.
7. Use **New password setup link** for an existing active client who needs a password reset. **Pause access** revokes portal access immediately on subsequent API/database requests, including existing signed-in sessions. It does not delete records. Reactivation restores access.

The owner sees all clients; a customer sees only their own data. Do not add internal-only notes to client-visible project next steps or replies. The owner CRM and financial records remain separate. There is no public signup, file upload, payment processing, or automatic email in this release.

## Security and operations

Server checks use Supabase's verified user endpoint, not user-editable role metadata. Every exposed table has RLS; only the owner can write projects/accounts or reply to requests. Customer request inserts have column grants that prohibit forged status/replies. Anonymous users have no table access. The intake rate-limit table intentionally has no anon/authenticated policies or grants; only the service role can access it.

HttpOnly, Secure, SameSite=Lax cookies carry sessions. Mutations require the same Origin. APIs return no-store responses and no tokens to browser JavaScript. Client pages use same-origin CSP; private records are rendered with escaping. Sign-out clears cookies and the view. Public activation hashes are removed from the address bar before verification. Setup links are bearer credentials and expire per the project's Supabase email OTP settings; generate a fresh link if needed.

Inquiries are limited to 5/hour per hashed IP, 20/minute globally, 100/day globally, plus validation and a honeypot. This is basic abuse protection, not a CAPTCHA or a guarantee against spam. Direct callers can spoof Origin/IP headers; global caps bound writes. Check inquiries regularly; no automatic deletion or outbound notification is implemented. Export owner backups and handle deletion requests deliberately.

Enable Supabase's leaked-password protection in Auth settings if available on your plan. Review account/session settings and keep owner credentials private. There is no claim of a legal compliance certification; review the published privacy notice for your actual business practices.

## Verification

`npm test` covers server authentication, role restrictions, CSRF, forged fields, concurrency, cookies and failures, plus the existing assistant checks. A database transaction with two synthetic customer identities checks actual RLS and rolls back all fixtures. Visual QA uses explicitly synthetic local data; no real customer accounts need to be created for testing.

After Cloudflare preview deploys, test your existing owner login, sign out, and verify direct /dashboard/ access returns to login. Create a deliberate test client only if you want to test a complete real activation; verify customer requests/replies before onboarding real clients. Check the browser at mobile width and confirm the contact form shows a receipt only after a saved inquiry.
