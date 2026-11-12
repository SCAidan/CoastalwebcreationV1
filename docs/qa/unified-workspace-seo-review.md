# Unified workspace, login branding, and SEO review

This branch implements the approved owner-workspace direction and the requested login and public SEO improvements. Production deployment is pending review.

## Workspace behavior

- Overview shows real portal requests and existing follow-ups. Requests refresh on entry and with Refresh; there is no background push subscription.
- Add a business requires a name and business. Calls, tasks, payments, and workflow details stay accessible from its detail view.
- The business board projects the existing lead, client, project, call, task, and transaction arrays. Source records are retained; there is no database migration or destructive consolidation.
- Business names match after whitespace trimming and case normalization only. Different spellings remain separate; duplicate lead or client-account names display an ambiguity notice.
- Workflow metadata uses string fields on existing owner records and is included in JSON exports/imports. Editing a legacy record preserves these fields.
- Owner workflow notes and client-visible portal project status have separate, explicitly labeled save controls.
- Request status/replies use the existing authenticated portal endpoint. Client account setup remains in the existing access-management page.
- Analytics, inquiry counts for client sites, uptime, and form monitoring remain unconnected and are labeled accordingly.

## Public site

The login uses the existing cypress wordmark. Three visible, distinct service pages cover web design, redesign, and ongoing care. The homepage links to them. Canonicals, descriptions, social metadata, and truthful Organization/Service/Breadcrumb structured data are included. No fake address, testimonials, ratings, hidden keywords, or competitor keyword pages were added.

The XML sitemap now contains canonical indexable pages and excludes the noindex design examples. A human-readable site map is linked in the footer. Robots.txt already advertises the XML sitemap. Submission and indexing checks in Google Search Console remain a post-publication step; ranking and indexing are not guaranteed.

## Validation

- 106 automated tests passed, including source preservation, grouping ambiguity, portal account association, unsafe website URLs, and sitemap/publication boundaries.
- Public build and release scan passed: 84 public files, zero secret/source-map findings.
- Cloudflare Pages Functions Worker compiled successfully.
- Reachable Git-history secret scan passed.
- Desktop browser QA used only the synthetic local fixture: login branding, quick-add business, workflow stage/checklist/next-action saving, persistence after reload, request reply/status saving, and the service-page layout.
- Responsive CSS is included; phone-sized browser emulation was unavailable in this browser session. A physical-phone review remains recommended before production.
- No live customer records were changed, no client messages were sent, and no production deployment was performed.
