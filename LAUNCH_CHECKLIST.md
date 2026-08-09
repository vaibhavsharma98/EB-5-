# The Calculus website launch checklist

Last technical/content review: 9 August 2026.

This file separates work that requires company authority or professional
sign-off from work already implemented in the website.

## Launch blockers — owner action required

### 1. Verify company identity and evidence

- [ ] Confirm the legal entity name that operates the website and add it to the
  Privacy Notice, engagement documents, invoices, and email footer.
- [ ] Confirm the canonical domain is `thecalculusgroup.com` and that use of
  `sukhjitanand@calculusindia.com` is intentional. Prefer a verified mailbox on
  the public domain if available.
- [ ] Verify the New Delhi address, phone number, contact mailbox, and Managing
  Partner title exactly as published.
- [ ] Place dated records in the company evidence folder supporting the 1985
  founding date, continuous business history, and leadership biography. The
  site says this is a company legacy, not 41 years of EB-5 experience.
- [ ] Confirm the company owns or has commercial web rights for every image,
  logo, font, and icon in `assets/`.

Keep the following claims off the website unless documentary evidence, current
status, and publication permission are supplied: ISO/ICEF/AFECI credentials;
rankings; client/family counts; success rates; “first”, “largest”, or “only”
claims; audited/tier-one partner claims; specific real-estate experience; and
client testimonials.

### 2. Obtain professional legal/compliance sign-off

- [ ] U.S. immigration counsel: approve all EB-5 process, eligibility, visa
  availability, concurrent-filing, CSPA, I-829, and naturalisation statements.
- [ ] U.S. securities counsel: approve project-comparison language, referral
  arrangements, compensation/conflict disclosures, and the no-guarantee copy.
- [ ] Indian FEMA/tax counsel or an authorised dealer bank: approve remittance,
  LRS, source-of-funds, overseas-investment, and tax language.
- [ ] Indian privacy counsel: align `privacy.html`, consent wording, retention,
  processors, grievance contact, and deletion process with actual operations.
- [ ] Finalise signed engagement letters that define included services, fees,
  exclusions, independent professionals, referral compensation, conflicts, and
  complaint/escalation handling.

### 3. Configure production infrastructure

- [ ] Point `thecalculusgroup.com` and `www` to the intended Vercel Production
  deployment; remove the current maintenance page only after sign-off.
- [ ] Add all `.env.example` variables in Vercel. Use a dedicated, monitored
  enquiry inbox and a verified production sender.
- [ ] Publish SPF, DKIM, and DMARC records, then prove delivery to Gmail and
  Outlook without spam-folder placement.
- [ ] Add Vercel edge/WAF rate limiting or a privacy-appropriate managed bot
  challenge if form abuse appears. In-memory API limiting is only a first layer.
- [ ] Define who responds to leads, the response-time target, backup ownership,
  CRM/inbox workflow, and deletion/retention procedure.
- [ ] Enable uptime and serverless error alerts; assign an owner who can respond.

## Required pre-launch acceptance test

- [ ] Create a Vercel Preview with production-like environment variables.
- [ ] Submit Contact, Readiness Review, and Journey Access on a real phone and
  desktop; verify validation, consent, success/error states, received email,
  reply-to address, and duplicate/spam handling.
- [ ] Test current Chrome, Safari, Firefox, and Edge at 360 px, 768 px, 1440 px,
  keyboard-only navigation, 200% zoom, and reduced-motion mode.
- [ ] Check every page on the final HTTPS domain for a valid certificate, no
  mixed content, correct canonical/OG image, working 404, and no console errors.
- [ ] Submit `sitemap.xml` in Google Search Console after DNS cutover and request
  indexing for the home, disclosure, privacy, and core EB-5 pages.
- [ ] Record the production release date, approvers, source citations checked,
  and commit hash.

## Recurring governance after launch

- [ ] Monthly: review the Department of State Visa Bulletin and update the
  dated program-status block and related FAQ copy.
- [ ] Quarterly: verify USCIS program rules, processing guidance, RBI rules,
  professional licences, referral relationships, contact details, privacy
  vendors, and broken links.
- [ ] Annually: review security headers, dependencies, privacy retention, image
  rights, accessibility, SEO, and all substantiation records.
- [ ] Immediately: update the site after material legislation, government
  guidance, data practices, service scope, fees, conflicts, or partner changes.

## Optional trust upgrades after evidence exists

- [ ] Add named leadership photography and short biographies with written
  approval.
- [ ] Add verified client stories only with written publication consent and no
  implication of typical or guaranteed results.
- [ ] Add named independent professional profiles with licence jurisdiction and
  links to official registries.
- [ ] Add a transparent fee/scope explainer and referral-compensation statement.
- [ ] Add privacy-respecting analytics only after the Privacy Notice and consent
  approach match the selected vendor and configuration.

