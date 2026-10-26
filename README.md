# Coastal Web Works

Cloudflare Pages website, private owner workspace, and invite-only customer portal. Start with [SETUP.md](SETUP.md). Run `npm test` for backend and assistant checks, or `npm run dev` for a static preview. Production API routes run on Cloudflare Pages.

See [setup/CLIENT_PORTAL.md](setup/CLIENT_PORTAL.md) for client onboarding, deployment, privacy boundaries, and verification.

Deploy with build command `npm run build` and output directory `dist`. The repository root is not a safe static output directory. See [security audit](audits/security-audit-2026-10-26.md) for verified checks and account-side follow-ups. Interim PayPal payments are at `/pay/`; verification remains manual.
