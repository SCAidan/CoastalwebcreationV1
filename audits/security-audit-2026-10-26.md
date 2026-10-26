# Coastal Web Works security audit

Date: October 26, 2026. Repository: SCAidan/CoastalwebcreationV1. Baseline production commit: 30eca927abcf82b173e1b08c929eaa696a2af710. This is an evidence-based code and deployment review, not a guarantee that no future vulnerability or disclosure can occur.

## Outcome

No privileged API keys, real access/refresh tokens, private keys or credential-bearing database connection strings were detected in the reviewed source, reachable Git history or the generated public release. The original scans identified the existing Supabase publishable key in two historical locations. That identifier is designed to be public and is not a service-role key. Its unused browser copy was nevertheless removed; server configuration remains private to the Functions bundle. No credential rotation was performed because no privileged credential exposure was confirmed.

A real deployment-boundary issue was confirmed: the baseline website served server/auth.js, setup SQL, gateway source, test files, demo server source and package.json as static assets. The normal HTTP path is now restricted by an explicit publication allowlist, all-route middleware, a real 404 page and security headers. Auth helpers were moved inside the non-asset Functions directory. A separate allowlisted dist build physically excludes source, tests, documentation, environment files and maps.

**Before production deployment:** set Cloudflare Pages build command to `npm run build` and output directory to `dist`. Use the same settings for preview builds. The existing repository-root output must be retired. Middleware is defense in depth; it is not a substitute for publishing only dist. Cloudflare can serve static assets if Functions are configured to fail open under quota failure. This provider setting could not be inspected while the admin browser was signed out.

## Scope and evidence

- All tracked application, API, configuration, SQL, test and documentation source; baseline Git history contained 18 reachable commits and 119 unique blobs.
- Gitleaks 8.30.1, checksum-verified from the official release, plus an independent history pattern scanner. Only the exact known publishable key has a documented Gitleaks exception. No broad path exclusions hide application code.
- Generated public payload: 40 files, including deployment control files; scanned text and raw binary bytes for recognizable credential patterns, JWT literals, private keys, database credentials, environment serialization and source-map references. The site uses plain browser JavaScript rather than a frontend bundler.
- Compiled private Cloudflare Functions bundle: scanned separately for literal sensitive values. It contains runtime environment references and the non-secret project identifier; it must never be treated as a public asset. A negative scan correctly rejects it if passed to the public-release scanner.
- Local automated tests cover auth verification, owner/client roles, CSRF, tenant isolation assumptions, cookies, bounded requests, invalid JSON, optimistic concurrency, API payload filtering, publication paths, methods, headers, secret detection and runtime environment canaries.
- Supabase live metadata reviewed: RLS is enabled on all seven public tables, anon has no public-table grants, and no storage buckets are public. The three application RPCs use SECURITY INVOKER. The platform auto-RLS event trigger uses SECURITY DEFINER with pg_catalog search path and no anon/authenticated execute permission.
- A fresh rollback-only live database regression verified two-customer separation, owner access, denied cross-client request creation, denied forged status/reply, paused access and anonymous denial. No real customer information was fetched and synthetic fixtures were rolled back.
- Baseline HTTP checks distinguished SPA fallback HTML from actual source maps or environment files: .env/.git/map requests returned the homepage, not those files. No actual map or env payload was found at those URLs.
- Baseline private API GETs returned 401. An unauthenticated assistant POST returned 401 before any model invocation; no paid model request was made. This is consistent with configured nonempty production bindings, but does not validate their values or account-wide permissions.

## Findings and remediation

| Finding | Severity | Remediation and status |
| --- | --- | --- |
| Repository-root static publication served backend/helper/setup/test source | Medium | Fixed normal request paths with deny-by-default middleware; moved auth helpers under Functions. Clean dist packaging implemented. Cloudflare build/output setting still needs account-side confirmation before production. |
| Supabase publishable key unnecessarily shipped in dashboard/config.js | Low | Removed. Browser config contains only a UI feature flag. Historical occurrences are classified public identifiers, not privileged leaks. |
| No repository security workflow or locked build tool dependency | Medium | Added a locked, exact Wrangler version, npm integrity lockfile, pinned GitHub action commits, read-only job permissions, no persisted checkout credential, tests, dependency audit, history scans, release scans and worker compilation. Require the check on main through repository protection settings. |
| Missing CSP on public and owner pages and unnecessary remote font import | Medium | Added same-origin script/connect/font policy, framing/object/base restrictions, no-referrer and nosniff; removed Google Fonts import. Legacy dynamic chart styling requires inline styles; inline scripts remain prohibited. |
| Assistant read an entire body before checking size; generic endpoints accepted non-object JSON | Low | Replaced with bounded streamed parsing and explicit object validation, with regression tests. |
| API portal reads used wildcard column selection | Low | Replaced with explicit output columns to reduce accidental future disclosure. Database RLS still enforces row access. |
| CSV export allowed formula markers after leading whitespace | Low | Neutralizes those formula prefixes before export. |
| Supabase leaked-password protection disabled | Medium configuration follow-up | Existing provider warning remains. Enable it in Auth if available on the plan. No claim that it was enabled. |
| Cloudflare admin secrets, Access/WAF/quotas, deployment output and GitHub classic branch protection not directly inspectable | Unverified control | Cloudflare admin browser requires sign-in. No Cloudflare connector was available. GitHub returned no rulesets, which does not establish classic branch-protection state. No private secret values were requested or printed. |

## Reproducible check results

- 74 automated tests passed.
- npm audit reported zero known vulnerabilities across the locked dependency graph at scan time.
- Gitleaks history, working-tree and public-release scans passed after classifying the exact public identifier.
- The strict public-release scanner accepted 40 files and rejected an intentionally tested private Functions bundle.
- Functions compiled successfully with locked Wrangler 4.153.0; the compiled private worker contained no detected literal credentials.
- Runtime-environment canaries did not appear in generated public output.
- Live tenant/RLS regression passed with all fixtures rolled back.

## Auth and secret boundaries

Sensitive network operations use server functions. Each private API verifies the current Supabase user and uses server-selected identity; customer-supplied role or tenant identifiers cannot grant owner access. Tenant RLS applies even to direct Data API access. Owner-only provisioning is reverified inside the privileged gateway. The deliberately public inquiry action has input validation, a honeypot and database-backed global/per-identifier caps; Origin is not treated as authentication.

Session tokens are only in Secure, HttpOnly, SameSite=Lax host cookies; browser JavaScript receives role/navigation data rather than tokens. Mutations require the same Origin. API data is no-store. The login setup hash is removed before verification. The authenticated owner can deliberately generate a one-use client setup link; that is authorized runtime data, not a static bundled secret. Keep it private.

The OpenAI key stays in Cloudflare bindings. The Supabase service key stays in the Edge runtime. No frontend build uses environment substitution. A canary test verifies that runtime secret-shaped environment inputs do not enter output assets. Errors are generic and do not return raw upstream credentials or stack traces. No third-party analytics, payment SDK or client-side database SDK is added.

## Payment change

The owner-supplied QR decoded to a PayPal qrcodes/p2pqrc URL. The payment page uses that exact recipient URL and an equivalent generated SVG QR. A desktop request redirects to PayPal's app download page, so the page explains scanning with the PayPal app. A normal PayPal.Me or seller checkout link can replace it later for direct browser checkout. The page requests Goods & Services, tells the payer to verify Aidan Williams, and does not collect card details, authorize recurring charges, or mark an invoice paid. No payment or account change was executed.

## Remaining account-side steps

1. Set Cloudflare build command `npm run build`, output `dist`; verify Functions are still built from the root functions directory. Do not upload a bare static package without Functions.
2. Confirm secret bindings are stored as secrets in production, and only needed bindings exist in previews. Keep OpenAI and Supabase service credentials out of public-prefixed frontend variables and logs. Avoid owner sign-in on untrusted fork previews.
3. Select fail-closed behavior for Functions where appropriate and review rate limits/preview access. The public files in dist remain non-sensitive even if static fallback occurs.
4. Require the Security and release checks job before merging; enable available GitHub secret scanning/push protection. Existing Cloudflare auto-preview checks alone do not enforce this.
5. Enable available Supabase password protection and owner MFA. Public signup should remain disabled.
6. Review the final preview and run `npm run check:deployment -- https://<verified-preview-host>` before merging. After production deploy, repeat against the actual production origin and any custom domains. Older deployment URLs and public Git history are outside a new deployment's removal boundary; review retention/disable old previews where needed.

## Limits

Pattern scanners cannot prove the absence of every possible encoded, novel, historical-orphaned or third-party secret. GitHub issue/PR discussions, past provider build logs, detached/inaccessible commits, provider consoles, real owner credentials and completed money transactions were not audited by signing in or reading private values. No external penetration-test certification is implied. The checks are reproducible safeguards, and must remain required on future changes.

## Primary references

- https://developers.cloudflare.com/pages/functions/middleware/
- https://developers.cloudflare.com/pages/functions/routing/
- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/pages/functions/source-maps/
- https://supabase.com/docs/guides/api/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1
- https://www.paypal.com/us/legalhub/paypal/useragreement-full
