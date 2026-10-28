# Template collection QA — second review build

October 27, 2026. The owner's latest target is stronger differences in layout and customer journey, with gallery and Google/Yelp review placements. The four revised designs were subsequently approved by Aidan. The fifth photo-led addition is documented below; a QA pass is not merge authorization.

## Evidence and comparison

- `docs/qa/template-collection-v2/hvac-comparison.jpg` and `barber-comparison.jpg` place the previously reviewed first-screen designs beside the revised browser renders in the same comparison input. Both are normalized to 1348 × 926 content pixels at 1×. These are structure comparisons against the user's prior review artifacts, not claims to pixel-clone a regional business.
- Regional official sites inspected: Monterey Bay Heating/Cooling, The Barbers Inc, Artisans Salon and Coastal Roots Hospitality. Actual captures and source-specific observations informed navigation and content priority. Full research provenance and limits are in docs/template-collection-research.md.
- `mobile-review.jpg` shows the revised HVAC, barber and restaurant at 390 × 844 iframe surfaces (375 px observed content width). HVAC and barber were also checked at 768 px surfaces (753 px content).
- `technology-gallery.jpg` and `restaurant-reviews.jpg` show actual gallery/review placements. Original desktop browser captures provide the two new homepage preview WebPs.

## Findings resolved

1. P2, layout sameness reported by Aidan: HVAC and salon originally shared hospitality-like serif/photo storytelling. Rebuilt HVAC as a utility/service hub with selection tiles and a request panel. Rebuilt barber as a persistent sidebar, uppercase portfolio cover, staggered monochrome images, filters and a service board. The combined comparisons show changes in navigation, first-screen structure, content ordering, type hierarchy, imagery and interaction—not only palette.
2. P2, missing gallery and review examples: all four pages now contain galleries and explicit Google/Yelp placements. The restaurant's existing menu and warm identity remain intact; technology retains its selected lime design.
3. P2, gallery filter geometry: a single visible photo initially left empty tracks in a three-column layout. Selected category now controls the appropriate grid tracks, with the same aria-pressed and hidden states. Browser checks verified Detail shows one item and All restores three.
4. P2, lightbox load stability: set modal image dimensions from the already-loaded thumbnail so the image has reserved space before loading. Native dialog retains focus containment; Escape closes it and returns focus to the original link. Keyboard activation was verified on barber and restaurant.
5. P3, responsive breaks: added spaces after hidden line breaks so mobile headings do not join words. Restaurant navigation wraps and preserves 44 px link targets with the new Gallery/Reviews links.

## Five required fidelity surfaces

- Fonts/typography: HVAC uses compact bold system sans-serif utility type. Barber uses a heavier uppercase sans-serif hierarchy and studio wordmark. Restaurant retains Georgia-led warm dining typography. Technology retains the selected charcoal/lime sans-serif. No external font requests, invented font raster text or cloned logos. Phone and desktop headings wrap without clipping; the barber phone headline intentionally spans three lines.
- Spacing/layout: HVAC has header/intro/service desk/request panel, then job imagery; barber has sidebar/portfolio/service board; restaurant has food hero/menu/offset gallery/guest feedback; technology has service rail/system illustration/open service rows. The differing structures were checked in combined comparisons and actual lower sections.
- Color palette: navy/white/amber for HVAC, near-black/off-white/red for barber, existing warm dining palette for restaurant, selected charcoal/lime for technology. Focus remains visible. Selection uses aria-pressed plus a changed fill; native disclosure and dialog states remain semantic.
- Image quality: six original generated individual photos exported to same-origin WebP, all labeled sample/generated/not client work. No reference-business photos, brands, portraits or review content copied. The technology gallery uses a labeled illustration, not a fabricated completed client project. Covers are actual browser renders.
- Copy/content: explicit fictional labels remain. Google/Yelp areas say 'Demo placeholder · No reviews connected'. No fake names, customer quotes, ratings, counts or aggregate-rating schema. The HVAC request selector demonstrates a possible flow and clearly states that no service request is sent. No appointment booking or payment is represented as live.

## Interactions and accessibility

- HVAC Heating/Cooling/Air quality buttons change the heading, description and aria-pressed. Request dropdown changes explanatory guidance. No form is submitted by those controls.
- Barber All/Cuts/Detail filters hide the appropriate figures and change the grid. Links work as image-file fallbacks without JavaScript.
- Shared gallery uses a native modal dialog with a named close button, descriptive alt, sample notice, Escape handling and returned focus. Closing with Escape returned focus to Texture / Fade in the actual browser. Restaurant keyboard image activation opened the same dialog.
- Restaurant menu behavior remains unchanged; gallery/review links are real anchors. Technology gallery is discoverable from its header.
- Phone-sized document scrollWidth equals clientWidth for HVAC, barber and restaurant (375/375). Tablet HVAC and barber are 753/753. This checks responsive CSS; physical mobile hardware remains untested.
- Browser logs show no website JavaScript exception. Unrelated Chrome extension metadata errors were observed and excluded. A rapid click during a smooth anchor scroll missed its target in automation; keyboard activation and the settled page state verified the actual gallery behavior.
- Reduced-motion policy remains supported; all code/assets are same-origin and the existing CSP/security headers are unchanged.

## Validation and boundaries

- 91 automated tests pass: existing security/integration coverage plus handoff and gallery/sample-label tests.
- Build and release scan: 62 public files, zero findings.
- Static HTML check: 13 pages, no missing local link targets/anchors, duplicate IDs, missing image alt, missing head favicon, redirecting internal .html links or apostrophe-bearing business name.
- No API/auth/Supabase/payment/portal/dashboard/security-header logic changes. Only explicit new public-file paths added to functions/_server/public-assets.mjs; publication-boundary logic is unchanged.
- Existing inquiry field names, submit fetch and thank-you redirect are unchanged. Style handoff compatibility is preserved.
- No production inquiry, review connection, message, email or payment was sent during this revision. No PR or merge was performed. The original four-URL sitemap and robots file remain unchanged.

## Remaining review

- Four revised layouts approved by Aidan; finished fifth addition prepared for review. No production merge performed.
- Real client photography, genuine review/profile permissions and booking choices require client-specific decisions.
- Real-phone acceptance testing remains a follow-up; no broad accessibility certification is claimed.

No unresolved P0/P1/P2 implementation issue was found after the fixes and recaptures. The desired style is an intentional original adaptation of customer-task priorities, not a copy of the regional sources.

## Fifth example / October 27, 2026

- Added /templates/home-comfort as a separate photo-led option using the original large home photograph and green panel. Existing four demos retained. Homepage now has five cards and a fifth style choice.
- Heating/Cooling selector verified; Cooling shows “A breath of fresh air.” Gallery keyboard activation, native dialog, Escape and focus return verified. Style handoff selects “Photo-led home services example” on the agency form without submitting an inquiry.
- Phone/tablet captures in docs/qa/template-collection-v3. Content widths 375 and 753 px have matching scrollWidth; tablet header reflows into a clear second navigation row. Real-device testing remains open.
- 92 tests pass; 14 HTML pages pass the static link/anchor/alt/favicon/name checks; release scan covers 66 explicit public files with zero findings.
- No API/auth/Supabase/payment/security-header behavior changed. Four explicit public-file allowlist entries added for this example only. Original sitemap/robots unchanged.
- Figma editable reference catalog and regional research boards inspected after text/auto-layout corrections and original image placement. No clipped text or overlapping card content remains. The old exploration is archived.

## Construction conversion / latest review

- Converted the photo-led fifth example to Hearth Build construction/remodeling; preserved the approved big-photo/green-panel structure and retained the practical HVAC page unchanged.
- Changed hero/metadata, services, process, FAQ, gallery, homepage card, style label and generated inquiry note. Stable URL and backend compatibility retained. Two explicit same-origin asset entries added to the allowlist; no API or security behavior changes.
- Browser verified Additions and Finish work content changes, finish-work gallery modal, Escape closing and inquiry handoff selecting Construction & remodeling example. No inquiry submitted.
- Phone/tablet width checks: 375/375 and 753/753, with readable headings and no horizontal overflow. New screenshots under docs/qa/template-collection-v4. Physical mobile hardware remains untested.
- 92 automated tests pass; 14 HTML pages pass static checks; 68 explicit public files pass build/release scan.

## Interactive before/after / latest update

- Two construction gallery photos now compare matching generated old/new designs, with approved stronger before imagery rather than furniture-only differences.
- Browser: range Home shows 0% before/100% after; End shows 100% before/0% after; ArrowRight/ArrowLeft update the kitchen value. Clicking the house photo after End resets the split to its pointer location. After-image text link opens the native modal; Escape returns focus to that link.
- Focused tests cover initial state, endpoint labels, invalid values, active pointer tracking, unrelated pointers, bounds clamping and cancellation. 94 tests pass. Build/release scan: 70 explicit public files; 14 HTML checks pass.
- Phone/tablet comparison gallery has matching client/scroll widths (375/375 and 753/753). Captures in docs/qa/template-collection-v5. Native range remains visible, labeled and keyboard accessible; touch hardware remains untested.
- Generated sample disclosures and original after images preserved. Two before assets added explicitly to public allowlist; API/security behavior unchanged. No external dependency or real inquiry sent.

## Showcase priority and motion hint

- Construction now appears first in the demo grid and design-direction options after unsure. Browser DOM verified the first card is Construction & remodeling.
- One-time 1.8-second slider sweep begins when the image is sufficiently visible, returns to center and is interrupted by interaction. Reduced-motion users get no automatic motion. Browser observed 55/45 during the sweep and 50/50 after completion; focused tests cover interruption, reduced motion and no repeat.
- 96 automated tests pass, with unchanged clean 70-file build/release and 14-page HTML checks. No API/security change or production form submission.

## PR verification false positive

GitHub verification passed the 96 tests, dependency audit, independent history scan, release scan and Worker compilation. Gitleaks then interpreted the literal design-palette wording “tokens: navy/white/amber” in historical QA prose as a generic API key. The finding was inspected and confirmed to contain only color names. Renamed the current prose to “Color palette” and added an exact-secret allowlist for ^navy/white/amber$ in .gitleaks.toml so historical notes remain scannable. No rule, file, directory or history scan was disabled; no actual credential was added or exposed. Full Gitleaks history and public-artifact scans pass locally after this narrowly scoped correction.

## Logo covers and centered final card / latest update

- Kept five approved examples; final card is centered at the same width as other desktop cards. Actual DOM geometry: 601 px first/last widths, 0 px center error. The mobile override keeps the final card full width.
- Restaurant has an original warm SVG identity instead of the repeated slogan cover. HVAC adds a blue/amber emblem in the right-hand space. Barber replaces cover slogan and repeated short phrases with a black/red monogram and wordmark. Image alt keeps logo-led h1 headings meaningful.
- Actual desktop screens are reflected in updated restaurant/HVAC/barber cover assets and docs/qa/template-collection-v6/logo-covers.jpg. Phone capture and measured geometry are in that folder. SVGs parse successfully and use only same-origin static shapes/system text.
- Phone content/scroll widths match at 375/375 for all three; HVAC and barber tablet widths match at 753/753. No clipped logo or heading was found after loading settled.
- Existing 96 tests pass; 14 HTML checks pass; build/release scan covers 73 files; public artifact Gitleaks scan has zero findings. No behavior/API/auth/payment/CSP/security-header change; three exact public SVG paths added.

final result: passed
