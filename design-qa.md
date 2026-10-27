# Template collection design QA

Reviewed October 27, 2026. Owner review of the finished designs remains pending. This is implementation QA, not authorization to merge or publish to the business domain.

## Evidence and scope

- Selected target: the third displayed concept, Terminal Studio, charcoal/lime with service rail, typographic wordmark and isometric systems illustration. The user explicitly chose this direction and its logo treatment.
- Combined comparison: `docs/qa/template-collection/technology-comparison.jpg` puts the selected source and final browser screenshot together. Source normalized to 1348 px width; implementation screenshot has 1348 px content plus browser scrollbar, captured in a 1363 × 936 CSS viewport at 1× density. Lower-page content extends beyond the one-screen source.
- Three actual desktop renders: `docs/qa/template-collection/collection-review.jpg`; individual original browser captures are the three homepage preview WebPs under assets/.
- Responsive evidence: `docs/qa/template-collection/mobile-review.jpg`; three 390 × 844 iframe surfaces, each with 375 px observed content width due to scrollbars. This checks responsive CSS in the actual browser, not hardware or touch emulation. Technology also checked at 768 px iframe / 753 px content width.
- The two additions were built as requested original layouts for review. They have no previously selected mockup to claim pixel fidelity against.

## Iteration and resolved findings

1. P2, technology typography: initial headline was visibly undersized compared with the selected mockup. Increased desktop scale from 6.15vw to 7vw and reviewed a new combined comparison. Result preserves the source hierarchy and two-line composition.
2. P2, image integration: original opaque diagram made a visible rectangular patch. Generated a genuinely transparent asset, exported WebP with alpha, and recaptured the hero. Background now integrates with the charcoal surface.
3. P2, direction handoff: new frontend values would be rejected by the existing backend allowlist. Record the exact direction in the existing message field and normalize only the two new values to `unsure` on native FormData creation. Existing restaurant/professional values, form field names, fetch handler and API remain unchanged. All five direction choices appear in the native select (including undecided).
4. P2, repeated selection: changing between the two additions could append conflicting generated notes. Replace only a complete matching generated note, preserve other project text, deduplicate repeated clicks, and fail safely if the message is full. Three focused regression tests cover these cases.
5. P3, mobile line break behavior: added whitespace after responsive display breaks so hidden breaks do not join words.

## Required fidelity surfaces

- Fonts/typography: technology uses the site's same-origin Arial/Helvetica stack; wordmark keeps Terminal bold white and Studio lime. Strong sans-serif hierarchy matches the selected direction. Slight glyph/spacing differences from generated lettering are intentional because the site retains system fonts. Hearth uses a warm upright serif; Forme uses oversized editorial serif/italics. Readable wrapping observed at desktop and phone-sized widths.
- Spacing/layout: asymmetric technology service rail, open service rows and dark/light sections; Hearth picture-window hero with offset square panel, tabbed service finder and three-step band; Forme split cover, centered studio statement and treatment ledger. These are distinct compositions, not recolored copies. Desktop anchors and middle sections were inspected after scroll settled. No overlaps found.
- Colors/tokens: technology charcoal #101611 and lime #c4fb70; Hearth forest #214b3e and paper #f4f2eb; Forme wine #612e28, cream #f6efe7 and tan #e8d7c5. Contrast, visible focus, selected control colors and non-color active weight checked. No external fonts/scripts/CDNs introduced.
- Image quality: individual original generated assets exported as WebP; no flattened page screenshot is used as the page itself. Diagram is decorative with empty alt. Photos have descriptive alt. Homepage preview images are actual browser renders. No placeholders or fake icons.
- Copy/content: fictional labels and FAQ explanations are visible. No invented reviews, qualifications, business addresses, service guarantees or functioning booking claims. All primary inquiry links go to Coastal Web Works. Template wordmarks are fictional, not an agency rebrand.

## Interactions, accessibility and integration

- Technology service rail uses real section anchors and updates aria-current plus selected weight/color. Native FAQ disclosures work without JavaScript.
- Hearth service buttons switch all three titles/descriptions and aria-pressed states. JavaScript-only controls are hidden until initialized; no-JS service information remains available.
- Forme native treatment disclosures expand/collapse. Navigation and all CTAs have real destinations.
- All pages retain skip links, semantic headings, image alt, favicon, noindex policy and root-relative clean URLs.
- Phone-sized technology, home services and salon have document scrollWidth equal to content width (375 px). Tablet technology likewise 753/753. Device hardware testing remains a follow-up.
- Native select includes the new directions; links from both new pages and homepage cards populate the chosen direction and project notes. Existing 'Discuss a new site' still selects 'A new website' among four service options.
- Safe local-only synthetic submission showed the preview-only response, not a success receipt. No production inquiry, notification email or payment was sent. Local preview sink is outside repository and never in release artifacts.
- Browser logs observed no site JavaScript exception; unrelated Chrome extension metadata errors were present. Native disclosure and service switch interactions verified.
- Reduced-motion CSS disables smooth scrolling, transitions and animation.

## Checks

- 89 automated tests pass (86 existing plus three handoff regression tests).
- Build and release scan: 51 public files, zero findings.
- HTML check: 13 pages; no missing local targets/anchors, missing image alt, missing head favicon, redirecting internal .html link or apostrophe-bearing business name.
- No API, auth, Supabase, payment, portal, dashboard, CSP or security-header logic changed. Only nine explicit public-file paths were added under functions/_server/public-assets.mjs so new public pages/assets pass the existing publication boundary.
- Restaurant files, robots and the exact original four-URL sitemap are unchanged.

## Follow-up checklist

- [x] Selected technology design implemented and compared after corrections.
- [x] Home services and salon layouts implemented with different structures.
- [x] Four-card showcase, real preview images and direction handoff connected.
- [x] Browser interactions, responsive sizes, links and automated release checks reviewed.
- [ ] Aidan reviews all three completed designs.
- [ ] Create PR / merge only after owner review; then verify production.
- [ ] Real-phone acceptance check before customer reuse.

No unresolved P0/P1/P2 implementation issue identified. Generated source font nuances and regenerated illustration details remain acceptable P3 differences. Future reuse remains subject to owner approval and customer-specific content/integration work.

final result: passed
