# Coastal Web Works design example catalog

Status: Aidan approved the four revised templates on October 27, 2026 and requested an additional photo-led home-services example based on the original HVAC concept. Aidan subsequently liked the fifth page and requested converting one HVAC option to another home service. The photo-led page is now a construction/remodeling example; the service-first HVAC stays unchanged. No production merge implied.

| Example | Route | Distinct layout | Best starting point |
| --- | --- | --- | --- |
| Sunday Table | /templates/restaurant | Existing full-width food story, menu filters and warm hospitality sections | Restaurants, cafés, hospitality |
| Terminal Studio | /templates/professional | Charcoal/lime, asymmetric service index rail, systems art, open service rows | IT, technology and professional services |
| Hearth | /templates/home-services | Utility header, service hub, selectable tiles and request panel; project gallery | HVAC, electrical, plumbing and other trades |
| Forme Barber Studio | /templates/salon | Studio sidebar, oversized uppercase type, staggered haircut portfolio, filters and service board | Barbers, grooming studios and portfolio-led salons |
| Hearth Build | /templates/home-comfort | Large project photograph, offset green panel, remodels/additions/finish-work selector and build-process band | Construction and residential remodeling |

## User decisions

Aidan chose the third displayed charcoal/lime concept and its Terminal Studio wordmark. He also liked the first navy/cyan concept, but preferred green for this build. Keep the approved Coastal Web Works cypress logo on the agency website and business documents; the fictional demo wordmarks are not replacements for that logo.

The four revised examples are approved as visual starting points for future client work. The photo-led addition restores the first HVAC direction as a separate fifth example, including gallery and review placements. Its finished page awaits review. Do not merge automatically. Preserve their different layout structures when adapting them; do not make every future customer site a palette swap.

## Safe adaptation

Use each page as a starting structure, then replace fictional names, service content and generated images as appropriate. Agree the customer's scope, assets, claims, brand, area, service details and integrations. These demos do not book appointments, take payments or provide services. Never turn their illustrative copy into unverified customer claims.

All assets stay same-origin. No external scripts/fonts, credentials, customer data or analytics are embedded. New routes/assets must be explicitly listed in functions/_server/public-assets.mjs. Never remove this publication boundary or broaden it to a directory wildcard.

## Inquiry compatibility

Existing restaurant/professional values remain accepted unchanged. Frontend values home-services/salon/home-comfort are included in the native select and recorded as a clearly labeled line in message. The existing formdata event normalizes only these new values to unsure for compatibility with the unchanged backend allowlist. Preserve the note in submissions. Do not extend the Supabase gateway implicitly or introduce a second form API.

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

## Fifth example and reference handoff

The original green/cream photo-led HVAC design is retained at /templates/home-comfort, with the existing original home photograph, an independent service selector and gallery. The service-first HVAC remains at /templates/home-services. Homepage now lists five examples and all choices reach the existing inquiry flow. Four additional explicit public-file paths are allowlisted; no backend behavior changed.

Figma: https://www.figma.com/design/0fgc6U9h4hFQ08XIBVkxNY?node-id=6-2 — editable five-template reference catalog; research board at node 6:54. These are reference boards, not full editable website screens. Existing technology exploration is archived.

Drive reference folder: https://drive.google.com/drive/folders/1u9hAeQLftOyHFGuH3No0uS3BCaISnVOl — current catalog, approval history, official-source research, adaptation rules and next work. See docs/qa/template-collection-v3 for the fifth browser captures.

## Construction conversion / latest decision

Aidan liked the fifth layout, then requested changing one of the two HVAC examples to a different home service before PR. The photo-led route is now Hearth Build, a fictional construction/remodeling business. Preserve its stable /templates/home-comfort URL, files and inquiry value; the visible option is Construction & remodeling example. Service choices are Remodels, Additions and Finish work. The practical blue Hearth Heating & Air example is unchanged.

New original generated assets: assets/template-construction-home.webp and assets/template-construction-detail.webp. The cover has no HVAC equipment; gallery images show a completed cedar/plaster home and oak cabinetry/stone finishes. Labels say generated sample / not client work. No licenses, contractor number, guarantees, customer quotes or real project claims invented.

Built-in image generation prompts: (1) wide editorial completed California coastal cedar/plaster home, timber deck, golden light, no HVAC units, workers, text or branding; (2) close editorial oak kitchen cabinetry, timber joinery and stone finishes, natural light, no people, text, branding or HVAC equipment. Generated with the built-in tool, exported to same-origin WebP. Screenshot evidence: docs/qa/template-collection-v4.

## Interactive before/after / latest update

Aidan requested interactive comparisons on both construction gallery photos. He rejected the first subtle before images as mostly furniture changes, then approved the stronger old-to-new design versions. Exterior before now has dated brown shingles, brickwork, older windows and a timber balcony; kitchen before has raised-panel upper cabinets, tile counters and older fixtures. The existing modern after images remain unchanged.

Before assets: assets/template-construction-home-before.webp and assets/template-construction-detail-before.webp, generated by editing the original after images with the built-in image tool. Final prompt intent: retain camera, crop, main geometry and lighting while changing to a clearly dated 1970s/1980s house exterior and 1980s kitchen respectively; no people, text, branding, unsafe damage or real-project claims. These are illustrative transformations, not evidence of actual contractor work. Earlier subtle variants are superseded and not published.

Each comparison supports photo pointer dragging and a visible native range control. Arrow keys adjust it; Home and End show full views. Screen readers receive before/after percentages, with end-state labels hidden when their image is no longer visible. Pointer capture handles dragging outside bounds, cancellation and other pointer IDs. Native vertical touch scrolling remains available. Without JS, the after image and before/after file links remain useful; controls are hidden. The after-image text link retains the existing native gallery dialog and Escape/focus-return behavior.

94 automated tests, 14-page HTML check and clean 70-file release scan pass. Desktop and phone/tablet CSS evidence is under docs/qa/template-collection-v5. Physical touch-device testing remains a follow-up.

## First showcase placement and one-time motion hint

Aidan requested making construction one of the first examples customers see and adding a small initial slider motion. Hearth Build is now first in the homepage demo grid and first after the unsure option in the design-direction select. Other template structures are unchanged.

Each comparison makes one 1.8-second, 15-percentage-point sweep around the center after at least 45% of its photo comes into view, then returns to 50/50. It never repeats during that page visit, stops immediately on range focus/input or photo interaction, and does not run for prefers-reduced-motion. Changes to reduced-motion preference also stop active motion. Native comparison controls remain available. Tests cover viewport-triggered start, interruption, center reset, one-time behavior and reduced-motion exclusion.

Final automated count: 96 passing tests; 70 explicit public files; 14 HTML pages. Figma card contains comparison/approval notes; further Figma changes reached the Starter MCP call limit, so the latest ordering/motion notes are preserved in Drive and Git.
