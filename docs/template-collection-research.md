# Regional website research and template revision

October 27, 2026. Aidan liked the first demos' appearance but found the HVAC, salon and restaurant too similar in layout and mood. He requested real regional-business references, stronger structural differences, galleries and clearly illustrative Google/Yelp review placements.

## Primary sources inspected

- Monterey Bay Heating, Cooling & Electrical — https://www.montereybayheatingandcooling.com/
  - Opened official site, inspected service/phone navigation and actual first-screen screenshot. Utility header, service-specific navigation, practical next steps and review section informed HVAC's task-first approach.
- The Barbers Inc, San Jose — https://thebarbersinc.com/
  - Opened and captured official homepage. Prominent type, haircut imagery, booking and review navigation informed the importance of putting the work before a long salon story. No brand, photos, slogans or promises copied.
- Artisans Salon, Monterey — https://artisansmonterey.com/
  - Opened and captured official homepage. Portfolio navigation and Google Reviews section reinforced service-business gallery and review requirements.
- Coastal Roots Hospitality — https://www.coastalrootshospitality.com/
  - Opened official site; menu links to restaurant experiences, a gallery and location information. This supports keeping the dining template warm and visit-oriented while changing the other businesses' structures.
- Bogner HVAC — https://www.bognerhvac.com/
  - Official source read through web retrieval: explicit service categories, service finder, testimonials and work imagery. Supplementary research; not claimed as a visual capture.
- Alvarado Street Brewery — https://alvaradostreetbrewery.com/pages/montereybrewpub
  - Official page read through web retrieval: menu, hours and visit details. Browser page had an age confirmation, so no verification step was submitted and it was not accepted as visual evidence.

These are established regional references, not a verified ranking of the largest businesses. Research concerns layout and customer tasks, not endorsement or copying their claims. Their pictures, reviews, awards, ratings, customer counts, pricing and certifications are not used in the demos.

## Structural decisions

| Demo | First impression and journey | Gallery and reviews |
| --- | --- | --- |
| Technology | Keep selected charcoal/lime system and service rail | Network illustration shown as a sample project-gallery placement; Google/Yelp panels |
| HVAC | Utility header, text-first service hub, selectable service tiles and a request-options panel; no lifestyle-photo hero | Equipment/project gallery, lightbox, practical review panels |
| Barber | Persistent studio sidebar, oversized uppercase type, staggered monochrome haircut portfolio; service board follows work | Portfolio filters and lightbox; review ledger rather than hospitality quote styling |
| Restaurant | Preserve warm food-led design and existing menu interaction | Offset food/dining-room gallery; centered guest-review placements |

## Honesty and integration boundaries

Every gallery image has an explicit generated/sample label. No pictured person is represented as a real client. No invented customer names, quotes, stars, review averages, counts or schema ratings are added. Google/Yelp sections say 'Demo placeholder · No reviews connected'. They demonstrate placement; no live third-party widget, API, scraping, tracking, profile or paid service is connected.

On a real project, use approved business photography and genuine feedback with attribution/source links and permissions where required. Integrations and fees must be agreed separately. Existing same-origin security policy remains unchanged.

## Implementation and reusable references

The prior layouts remain in Git history, not as approved defaults. HVAC styles/behavior are isolated in templates/hvac.css and hvac.js; barber styles in barber.css; gallery/review presentation and lightbox/filter behavior in evidence.css and evidence.js. These are real DOM pages and interactions, not flattened screenshot mockups.

Aidan subsequently approved the four revised demos and asked to retain the original large-photo HVAC direction as a separate fifth example. The finished fifth page is prepared for review at /templates/home-comfort. The four revised structures can be used as approved visual references; customer-specific facts and integrations still need verification. Do not merge automatically or treat a preview as production.

## New imagery provenance

Built-in ImageGen, six individual prompts: (1) monochrome adult skin-fade portrait with textured top, dark backdrop; (2) a different adult with curly top/low taper, matching monochrome; (3) tight professional beard-detailing photo, unbranded trimmer, no injury; (4) technician hands testing a condenser beside a California home, navy sleeves, no face/logo; (5) organized residential air-handler and metal duct installation, neutral utility room; (6) warm neighborhood dining room with walnut, linen, ceramics and afternoon light. Each excludes text, logos and recognizable real-business branding. Exported WebP files live under assets/template-barber-*, template-hvac-* and template-restaurant-room.webp.

## Fifth direction and durable references

The photo-led Hearth Home example restores the original green panel and wide home photograph at a separate /templates/home-comfort route. It adds the same honest gallery and Google/Yelp placements. No further external research or copied assets were needed to restore this user-selected direction. This expands the choices without making the practical HVAC service desk resemble the restaurant or barber.

The connected Figma file now includes an editable catalog and research board with original content images, routes, approval states, source URLs, findings and reuse rules. Drive notes and a visual cover sheet provide the same handover. Preserve the distinction between source observations, design interpretation and tested behavior.

## Latest category change

After approving the look of all five layouts, Aidan requested converting one HVAC option to a different home-service business. The photo-led example is now construction/remodeling (Hearth Build), while the utility/service-desk example remains HVAC. The original visual structure stays; copy, sample imagery, service selector, homepage card and inquiry label now match remodeling, additions and finish work. No new external-business research was used or implied for this category conversion. Stable route: /templates/home-comfort. Original generated construction assets and prompts are documented in docs/template-collection.md. Figma and Drive references are updated to reflect this decision.
