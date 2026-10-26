# Review the Web Works redesign

Run `npm run dev -- --host 0.0.0.0 --port 4173 --strictPort` for a dependency-free local preview. Production API functions continue to run on Cloudflare Pages.

Check the homepage, real portfolio links, service selection, FAQs, animation pause, mobile menu and inquiry validation. Client login opens the existing owner sign-in dialog directly on the dashboard. Signing in and reloading retains the existing in-memory session behavior; no new session persistence or database permissions are introduced.

The public contact form prepares a mailto draft; it does not submit or save a lead. Client portal data access and automatic inquiries/thank-you flow still require backend implementation. Do not present them as live.

When a custom domain is connected, update the canonical URL, Open Graph URL, robots.txt and sitemap.xml together. Project links can remain hosted addresses until their domains are ready.

Motion uses native browser animations with a reduced-motion preference and an in-page pause control. Content remains visible without JavaScript. There are no added analytics, advertising cookies, libraries, or external fonts.

Review screenshots and comparison evidence in `docs/qa/`, and the results in `design-qa.md`. Merge the pull request to ship via the existing Cloudflare Pages integration. Revert the commit to restore the prior homepage.

## Customer design examples and direct contact

The header’s Design examples link leads to two runnable demos in templates/. Both are explicitly fictional, use system fonts, and return their selected style to the real inquiry form. The restaurant menu tabs are illustrative; there is no ordering or reservation system. The professional demo is not a real client. Demo pages are noindex and are not in the sitemap.

The owner’s phone number is visible in the hero, contact area and footer. Call/text links open the visitor’s device apps. The optional goal checklist appends a short brief to the email inquiry without overwriting notes or adding storage/tracking. Updated validation and screenshots are in docs/qa/customer-examples-review.md.
