# Contact links and customer design examples

final result: passed

## Scope and evidence
Existing approved Web Works design is the baseline. This update adds the owner-requested phone number, a customer-facing gallery of runnable examples, and a planning checklist. It does not replace the selected main-site direction.

- Desktop gallery: customer-template-gallery.jpg, 1348 × 926 screenshot raster.
- Runnable demo captures: ../../assets/template-restaurant-preview.webp and ../../assets/template-professional-preview.webp (actual browser renders, not invented UI mockups).
- Phone-sized browser iframe evidence: phone-contact-mobile.jpg, template-gallery-mobile.jpg, restaurant-demo-mobile.jpg, professional-demo-mobile.jpg. Each frame is 390 × 844 including its scrollbar; observed content viewport 375 px.
- Tablet checked at 900 × 844 iframe; observed content viewport 885 px. CSS breakpoints use iframe layout widths. No physical-device performance or touch results are claimed.
- Browser preview opened through the Work Mode preview service, with current source, assets and JavaScript.

## Visual review
- Fonts/typography: existing main-site Arial hierarchy is preserved. Restaurant uses a warm serif and food photography; professional example uses editorial serif, sidebar navigation, green/cream palette and service rows. These intentionally differ in layout, not only colors.
- Spacing/layout: two equal gallery columns on desktop, stacked on phones; readable 44px-or-larger choice controls. Initial tablet review found the longer navigation and contact column crowded. Moved the menu breakpoint to 960px and stacked the tablet hero, then recaptured and verified.
- Color/focus: existing cobalt/navy theme retained. Demo palettes and focus outlines remain distinct and readable. Restaurant image is darkened at small widths to protect text contrast.
- Assets: gallery covers are screenshots of the real demos. Restaurant food image is generated and explicitly identified as illustrative. No real client project is represented by a fictional demo.
- Copy/content: sample names, dishes and prices are labeled fictional. No fake testimonials, conversion outcomes, bookings, addresses, or promised delivery times added. The existing real-work section remains separate.

## Interaction checks
- Call links use tel:+18315219681, text links use sms:+18315219681. No call or text was placed.
- Gallery selection changes the inquiry’s design option without discarding existing project notes.
- Restaurant and professional “Use this style” links return to the real inquiry with the correct selection. Values are allowlisted.
- Planning checklist appends goals to existing notes; does not overwrite notes or send data. Duplicate identical briefs are not appended; the 3000-character limit is respected.
- Restaurant menu category buttons change visible sample dishes and aria-pressed state. Professional FAQs expand with native details controls.
- Mobile menu opens, navigates to the examples, and closes with correct aria-expanded state.
- No horizontal overflow in the main site or either demo: 375px content width at phone layout; 885px at tablet layout.
- Existing animation pause and reduced-motion support retained; demos respect reduced motion for hover/scroll transitions.
- Local link and asset targets checked. JavaScript syntax and whitespace checks pass. Existing 13 action/assistant tests pass.
- Console reviewed: no application errors. Extension metadata errors belong to the cloud browser extension, not these pages.

## Limits
The inquiry still prepares an email draft. No live inquiry was sent. Client-specific dashboards and automatic inquiry/thank-you handling remain separate backend work. Demo pages are noindex and omitted from the sitemap; real business content stays on the main site. No Google ranking or field Core Web Vitals claims are made.

Portfolio follow-up: opened the actual merged public mechanic homepage, captured it, and refreshed assets/williams-mobile-mechanic.webp with factual alt text. This distinguishes the two real project layouts and does not substitute an invented mockup for real work.
