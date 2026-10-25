# Setup verification — October 24, 2026

## Verified
- Owner login created and email confirmed.
- Supabase URL and public key configured; AI enabled on main.
- agency_workspaces and agency_ai_usage both have RLS enabled.
- Anonymous role has no SELECT privilege on agency_workspaces.
- Owner access and non-owner isolation were checked during initial setup.
- One saved cloud workspace exists; no customer contents were read for this review.
- claim_ai_request() is installed; successful live AI replies confirmed by the owner.
- Transactional database tests verified 10 allowed requests and denial of the 11th, plus rejection of a stale workspace revision. All test writes rolled back.
- Auto-RLS helper execution permissions were restricted during setup.

## This cleanup change
- Update privacy.html to describe enabled cloud and AI behavior and clarify which fields are sent.
- Remove williams-web-design-stage1 from the deployable tree.
- Preserve the original complete source at branch backup-before-setup-cleanup, commit 97db2871192c71701c089513c34af7553f9f62a2.
- Add isolated assistant endpoint tests (mocked upstream services; no real AI charges or customer data).
- Run with: node tests/assistant.test.mjs. All 12 tests (including the parent test) passed locally.
- Direct production HTTP probes were blocked by Cloudflare (403 / code 1010); these are not evidence that app authorization checks passed.

## Still requires account settings or device testing
- Supabase public Auth settings report disable_signup=false: disable new user signups in Authentication settings. Recheck after saving.
- Supabase advisor reports leaked-password protection disabled. Check whether the account plan offers it before changing plan or incurring charges.
- Review OpenAI project spending controls and automatic recharge. No budget amount has been authorized or verified. The database request throttle is not a monthly spending cap.
- Test login and a sample save on a second device, plus simultaneous-edit conflict behavior.
- Confirm old local records were imported if needed; import replaces the cloud workspace.
- Actual non-owner/expired-session and quota error paths need deployment-level verification; isolated tests do not prove live provider behavior.
- Verify the privacy page and removal of the legacy route after merging and production deployment.
