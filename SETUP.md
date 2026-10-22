# V3 quick start: blue logo + assistant actions

This is a complete replacement package, not just a patch. Export your dashboard JSON first. Upload the CONTENTS to the root of your existing CoastalwebcreationV1 repository, replacing matching files. Keep any already-configured values in dashboard/config.js; this package includes empty defaults. Do not upload the enclosing coastal-v3 folder. Cloudflare uses your existing settings and deploys the commit. No account connection is required for local action drafts.

## Commands you can use immediately
- Add Stephen G. Ford Painting as a lead and remind me to call Friday
- Add lead for Coastal Painting, email: paint@example.test, phone: 831-555-0100 notes: Asked for a quote
- Add task Review homepage by Friday
- Log a call with Coastal Painting notes: Left voicemail
- Set follow-up for Coastal Painting on Friday

The flow is: command → Review draft → edit fields → Confirm & save. Cancel/Discard makes no changes. A call log requires choosing an actual outcome. Follow-up updates require an EXACT existing business name; duplicates ask you to choose the record manually. No invented contact details. Check all extracted fields in review, especially names that contain words such as Call, Contact, or On.

This is a deterministic command parser for these patterns, not an unrestricted AI agent. Ordinary questions still use built-in summaries, or the optional read-only AI endpoint when connected. Action drafts are handled locally; model responses cannot directly write records. Actions do not delete records, send messages, place calls, process payments, or create invoices. AI API setup is optional for this first capability.

Weekdays mean the next matching day including today; “next Wednesday” on Wednesday means seven days later. Explicit YYYY-MM-DD dates are supported. Dates use the device's local calendar. Dates in the past are allowed but displayed for review. Reminders appear inside the dashboard only.

Blue logo: index.html now references assets/coastal-logo-blue.png. The public site retains your purple theme; the dashboard retains green/white.

Tests: `node tests/actions.test.cjs`. Local browser testing verified no change before review and a confirmed lead saved to browser storage. Real Supabase cloud saves still require account configuration and live integration testing.

---

# Coastal Web Work’s — version 3

## What works without accounts
Purple public site with the new identity, a green-and-white dashboard, six-month cash-flow chart, existing record editing/search/backup features and a built-in assistant with reviewed action drafts. Built-in mode uses deterministic summaries and command drafts, not AI. It answers four question categories: priorities, money, projects and pipeline. Starts from your existing browser-local records under the original storage key.

The logo is an AI-generated brand concept; verify spelling and suitability before commercial use. No trademark search has been performed. Testimonials remain hidden until real reviews are available. The mobile mechanic project is not linked until its domain is supplied. Cleaning Machine remains the featured project. Its cover is labeled illustrative.

## Replace files in your existing repository
Export dashboard JSON first. Upload this package's CONTENTS to the root of CoastalwebcreationV1. Do not place everything inside an extra parent folder. Keep the current Cloudflare Pages settings: framework None; build blank; output `.`. Cloudflare deploys the new commit. No domain is required. No changes to either existing service-business website are needed. This package has not been pushed or deployed on your behalf.

## Login and cloud storage (requires one-time account setup)
1. Create your own Supabase project. Keep its database password private.
2. In Authentication, create your owner user and set its password. Disable public signups. Copy the user's UUID.
3. In setup/schema.sql replace YOUR_AUTH_USER_UUID with that exact UUID. Run the script ONCE in Supabase SQL Editor. It creates an owner-only workspace table and AI usage limiter and row-level security. Do not grant anonymous access or disable RLS.
4. In dashboard/config.js enter the Supabase project HTTPS URL and public publishable (or anon) key. Never put service-role keys or OpenAI keys in this file.
5. Deploy, open /dashboard/, and click Connect account. Sign in. Sessions are in memory and expire when the page closes; refresh is handled while the tab is open. Sign-in loads cloud records and clears the local preview from view. Nothing migrates automatically.
6. To migrate: export your old local JSON BEFORE sign-in, sign in, then import that JSON. Import replaces the workspace. Confirm all records before deleting the backup. Cloud mode does not mirror real records to localStorage.
7. Test with sample data: anonymous REST reads must fail or return no rows; a different authenticated user must have no access; your owner can insert/read/update. Try a second device, then test simultaneous edits: revision conflicts stop further writes and ask you to export before reloading. Single-row snapshots are appropriate for this first small workspace, not a multi-staff CRM.

IMPORTANT: The dashboard page shell remains public. RLS protects cloud data; an obscure URL or noindex tag is not access control. Local preview is a separate, device-local workspace. Existing local preview data is not erased by connecting an account. After sign-out, cloud records are removed from the view. Refresh returns to local preview. The next UI iteration can separate demo and cloud routes completely.

## Optional real AI assistant
The server-side Cloudflare Pages function at functions/api/assistant.js is read only. It authenticates your Supabase session, checks OWNER_USER_ID, reads your SAVED cloud data, and calls the OpenAI Responses API. It has no mutation or sending tools. No AI API key is sent to browsers.

1. Add Cloudflare production secrets: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, OWNER_USER_ID, OPENAI_API_KEY, OPENAI_MODEL. Choose a model your OpenAI account supports; no model/pricing assumptions are hardcoded. Configure a billing budget in your API provider account. Never commit the secret key or paste it in chat.
2. Run the COMPLETE setup/schema.sql, which includes the atomic claim_ai_request database function and owner-only usage table. It allows 10 requests per 60-second window per owner. The endpoint refuses AI requests if the limiter is missing or unavailable. Request and output sizes are capped. This is not a monthly budget.
3. Deploy and test authentication, non-owner denial, cross-origin denial, missing configuration, quota failure and successful answers. Actual cloud/API integration cannot be verified without your credentials and deployment.
4. Set aiEnabled: true in dashboard/config.js ONLY after configuration. Sign in, wait for saved status and ask a question. AI uses saved cloud state, not pending unsaved edits. If disconnected, the interface uses built-in mode and labels it accurately.
5. Data disclosure: selected business names, project/task descriptions, dates, statuses and financial fields are sent to OpenAI for the question. Emails, phone numbers, website URLs and free-form notes are omitted. Up to 100 most recent records per category. store:false is set, but this is not a promise about all provider retention policies. Update the privacy notice and review provider settings before enabling.

No automated messages, calls, contract signing, invoice issuance, payments, tax calculations or calendar integration have been implemented. These require separate integrations.

## Financial and workflow limitations
Original project balance estimates still match business names; for multiple projects per client, use explicit project/client IDs in a future migration. Quoted project totals are not received income. Monthly care fields are plans, not paid subscriptions. Follow-up reminders appear in-app only. Built-in summaries and cash flow use your device date. This is cash tracking, not full accounting.

## Verification
JavaScript syntax, local links, overview/editor rendering and money summaries can be verified offline. Secure cloud sign-in, RLS, API billing, rate limits and actual model responses require your configured accounts. The old nested stage1 directory is not part of this package and should be removed from the repository after backup; it otherwise exposes outdated pages.

References:
https://supabase.com/docs/guides/auth/passwords
https://supabase.com/docs/guides/database/postgres/row-level-security
https://developers.openai.com/api/reference/resources/responses/methods/create
