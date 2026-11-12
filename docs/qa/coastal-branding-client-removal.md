# Coastal Desk branding and client removal review

Prepared for owner review and publication. Do not merge or deploy on the owner's behalf.

## Branding

- All 18 published HTML pages load the same shared Coastal Web Works brand stylesheet.
- Coastal Desk uses the public site's blue palette and cypress wordmark; the old wave placeholders are removed from the assistant, client-management screen, portal, payment, and confirmation pages.
- Client management has a clear title, section counts, consistent tabs, and direct links to manage or remove a client in Coastal Desk.
- Each of the five fictional design templates retains its own business identity, with a compact Coastal logo in the example toolbar and a subtle design credit in the footer.
- Login, legal, error, payment, confirmation, service, and site-map screens carry the same agency identity.

## Delete client

- Visible on business cards, business rows, business details, and the client-access management page.
- Opens a named confirmation. Confirming moves the business to Trash and hides it from the active overview, board, and live-site list. Open request summaries exclude removed businesses; historical requests remain available in the request filters.
- Trash is available in the Businesses view selector and includes Restore client.
- Calls, projects, payment history, and original owner records remain recoverable. Removing a business does not delete, pause, or change the client's portal account. The dialog explicitly states this; access can still be paused in Portal access.
- Nothing is removed from local state unless cloud saving succeeds. Cancellation and failed-save cases retain the original data.
- No user client records have been removed during implementation.

## Validation

Automated tests cover confirmation/cancellation, deletion and restoration, failed saves, portal-only clients, grouped restore markers, retained history/payment records, and unchanged portal access. Existing blank-website regression tests are retained. The public build, security boundary, and Worker compilation checks are run with the change.

The browser rejected preview access in this session. Visual browser verification is pending; no successful screenshot or physical-phone review is claimed. The owner should review Coastal Desk, client management, a template header/footer, and the confirmation/Trash flow before publishing.
