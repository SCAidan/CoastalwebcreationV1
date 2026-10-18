# Williams Web Design — review version

Public site: index.html. Dashboard: dashboard/index.html.

## Review locally
Run `python3 -m http.server 8000` inside this folder. Visit http://localhost:8000 and http://localhost:8000/dashboard/ .

## Cloudflare Pages
Create a NEW GitHub repository for this business. Upload this folder's contents (index.html at the repository root). Create a NEW Cloudflare Pages project connected to it. Framework: None; build command: blank; output directory: . ; production branch: main. Do not replace either existing business repository.

The public site is responsive and includes navigation, a featured Cleaning Machine project, services, process, about, FAQs, and an email-draft inquiry form. The contact address is aidan1465@gmail.com from your supplied account context; confirm it before launch. Change it in assets/site.js and privacy.html if needed. The form opens the visitor's email app, does not send automatically, and does NOT feed leads into the dashboard yet. No prices or client testimonials have been invented. Cleaning Machine cover is an explicitly labeled illustration, not a screenshot. Mobile Mechanic is deliberately not linked until its domain is ready.

## Dashboard scope
Interactive browser-local prototype: create/edit/delete leads, calls, clients, projects, tasks, income and expenses; search/filter; follow-ups; basic project balance estimates; JSON backups and restore; CSV money export. Starts empty. Settings can load explicitly fictional demo data after confirmation.

IMPORTANT: No login, database, cloud sync, automated calls, notifications, invoice issuing, or payment collection. Do not upload real customer records. A hidden/noindex URL does not provide access control. Before publishing for real use, either exclude dashboard/ or protect it, and implement secure authentication and owner-only database policies. Noindex is not security.

Money is cash tracking, not accounting. Project balances match business names and include Deposit/Final payment categories only: multiple projects for the same customer need project IDs in the next version. Monthly care fees are planned values, not automatically received revenue. Every income entry represents manually recorded money received. Follow-up dates are local device dates. No external reminders are sent.

## Next implementation stage
1. Confirm brand name, contact address, domain, and service offering.
2. Connect Supabase Auth and owner-only row-level security; no service-role secrets in browser code.
3. Replace browser storage with cloud records, use explicit project/client IDs and private backups.
4. Add an inquiry endpoint with validation/rate limiting and explicit success/error handling; then feed it into leads.
5. Connect invoice/payment provider and reconcile payments.
6. Add approved testimonials, client assets, and domain verification.

## Layout and accessibility
Purple editorial public site; separate green/white operations interface. Semantic landmarks, labeled forms, native dialog, keyboard focus styles, responsive grids, reduced-motion preference. No fake review scores or performance guarantees. No analytics installed. Privacy page is a review draft.
