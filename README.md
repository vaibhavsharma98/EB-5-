# The Calculus EB-5 website

Production-oriented static website with Vercel serverless lead forms. There is
no front-end build step.

## Architecture

- Public pages: Home, EB-5 overview, Journey, Services, Why Us, Beyond the Green
  Card, Education, About, Readiness Review, FAQ, Contact, Disclosures, Privacy,
  and 404.
- Shared front end: `styles.css`, `home.css`, and `scripts.js`.
- Lead APIs: `api/lead.js` and `api/journey-access.js`, backed by
  `lib/lead-service.js` and scoped Microsoft Graph application access.
- Hosting/security: `vercel.json` supplies browser security headers.
- Search: canonical metadata and `sitemap.xml` target
  `https://thecalculusgroup.com`.

## Local checks

Install dependencies once, then run the full automated check:

```powershell
npm install
npm run check
```

For visual review, serve the repository root rather than opening files directly:

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`. Static local servers do not execute the
serverless API; API validation is covered by the automated tests. Use a Vercel
Preview deployment for an end-to-end form-delivery test.

## Vercel configuration

Import the repository with Framework Preset `Other`, no build command, and the
repository root as the output. Configure every value in `.env.example` for each
environment where forms must work:

- `MS_TENANT_ID`, `MS_CLIENT_ID`
- `MS_CLIENT_SECRET` — the Entra application credential
- `MS_SENDER_EMAIL` — the Exchange mailbox permitted by Application RBAC
- `LEAD_TO_EMAIL` — the monitored enquiry inbox
- `SITE_ORIGIN` — the canonical production origin

The APIs accept same-origin Vercel Preview requests and the configured canonical
origin. Credentials must never be exposed in browser JavaScript or committed.

## Lead handling

Contact and readiness forms post to `/api/lead`; journey access posts to
`/api/journey-access`. Both paths validate fields and consent, use a honeypot and
minimum-fill-time check, apply best-effort per-instance rate limiting, and send
sanitised email. Production should additionally use edge/WAF rate limiting or a
managed challenge if abuse appears.

## Content governance

Program facts are dated and linked on `disclosures.html`. Review the Department
of State Visa Bulletin monthly and re-check the page whenever USCIS, Congress,
RBI, or SEC guidance changes. Do not restore credentials, rankings, client
counts, success rates, partner claims, or testimonials without dated evidence
and permission.

The substantiation record is in `CONTENT_AUDIT.md`; the owner launch checklist
is in `LAUNCH_CHECKLIST.md`.
