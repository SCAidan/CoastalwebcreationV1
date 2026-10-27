# Coastal Web Works design example catalog

Status: second review build after Aidan requested stronger differences in layout, regional business research, galleries and review placements. Not approved client defaults yet. October 27, 2026.

| Example | Route | Distinct layout | Best starting point |
| --- | --- | --- | --- |
| Sunday Table | /templates/restaurant | Existing full-width food story, menu filters and warm hospitality sections | Restaurants, cafés, hospitality |
| Terminal Studio | /templates/professional | Charcoal/lime, asymmetric service index rail, systems art, open service rows | IT, technology and professional services |
| Hearth | /templates/home-services | Utility header, service hub, selectable tiles and request panel; project gallery | HVAC, electrical, plumbing and other trades |
| Forme Barber Studio | /templates/salon | Studio sidebar, oversized uppercase type, staggered haircut portfolio, filters and service board | Barbers, grooming studios and portfolio-led salons |

## User decisions

Aidan chose the third displayed charcoal/lime concept and its Terminal Studio wordmark. He also liked the first navy/cyan concept, but preferred green for this build. Keep the approved Coastal Web Works cypress logo on the agency website and business documents; the fictional demo wordmarks are not replacements for that logo.

The request is to review the finished templates before treating them as references for future client work. Do not mark this catalog as approved or merge automatically. Preserve their different layout structures when adapting them; do not make every future customer site a palette swap.

## Safe adaptation

Use each page as a starting structure, then replace fictional names, service content and generated images as appropriate. Agree the customer's scope, assets, claims, brand, area, service details and integrations. These demos do not book appointments, take payments or provide services. Never turn their illustrative copy into unverified customer claims.

All assets stay same-origin. No external scripts/fonts, credentials, customer data or analytics are embedded. New routes/assets must be explicitly listed in functions/_server/public-assets.mjs. Never remove this publication boundary or broaden it to a directory wildcard.

## Inquiry compatibility

Existing restaurant/professional values remain accepted unchanged. Frontend values home-services/salon are included in the native select and recorded as a clearly labeled line in message. The existing formdata event normalizes only these new values to unsure for compatibility with the unchanged backend allowlist. Preserve the note in submissions. Do not extend the Supabase gateway implicitly or introduce a second form API.

## Assets and provenance

- Existing restaurant imagery and behavior are unchanged.
- Original technology network illustration and home/salon editorial imagery generated for these demos with the built-in image tool. Transparent technology artwork exported with alpha to WebP.
- Homepage cover images are actual browser renders of the pages.
- New artwork: assets/template-technology-art.webp, assets/template-home-photo.webp, assets/template-salon-photo.webp.
- New reusable public code: templates/collection.css and templates/collection.js, isolated from restaurant styles.
- See design-qa.md and docs/qa/template-collection for evidence, constraints and acceptance checks.

## Asset prompts

1. Standalone selected lime Terminal Studio hero illustration: sparse isometric server, laptop, cloud and nodes; fine lime outlines, subtle charcoal planes, transparent surroundings; no text, logos or blue.
2. Premium editorial California cedar/plaster home exterior with unbranded heat pump on right; warm afternoon light, drought-tolerant planting, wide composition; no text, people or logos.
3. Boutique salon interior with rounded sculptural mirrors, walnut stations, cream chairs, warm plaster and terracotta accents, natural light; portrait composition; no text, people or logos.

## Second review build

See docs/template-collection-research.md for the real regional websites inspected and why the structures changed. All four examples now contain sample galleries and explicit Google/Yelp review placements. No live review integration, star ratings, review counts or customer quotes are fabricated. New individual generated photos are labeled as samples. Gallery lightboxes support native modal focus and Escape; barber filters use accessible pressed states. The restaurant menu interaction is preserved. HVAC has its own task-first stylesheet; barber has a separate portfolio layout.
