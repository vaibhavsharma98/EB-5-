# The Calculus — EB-5 Website

A static, animated marketing site (HTML/CSS/JS). No build step. Deploys to Vercel as-is.

## Pages
index (Home) · what-is-eb5 · journey · why-us · beyond · about · education · eligibility · faq · contact
Shared: `styles.css` (design system), `main.js` (animations, menu, forms), `assets/` (logo).

## Run locally
Open `index.html` in a browser, or serve the folder:
`npx serve` (or `python -m http.server`).

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. In Vercel: New Project → import the repo → Framework preset: "Other" → Deploy. (No build command; output = root.)
   Or, from this folder: `npx vercel` and follow the prompts.

## Journey access email
The Journey page remains hidden until a visitor submits a valid email address,
country code, and 10-digit phone number. `api/journey-access.js` revalidates the
details and sends them by SMTP before granting access. There is no Google login
or OTP verification.

In Vercel, open **Project Settings → Environment Variables** and add these for
Production, Preview, and Development as needed:

- `SMTP_HOST` — SMTP server hostname
- `SMTP_PORT` — usually `465` (TLS) or `587` (STARTTLS)
- `SMTP_SECURE` — `true` for port 465; otherwise `false`
- `SMTP_USER` — SMTP username
- `SMTP_PASS` — SMTP password or provider app password
- `SMTP_FROM` — verified sender, for example `The Calculus <website@your-domain.com>`
- `SMTP_TO` — address that receives journey access leads

Use `.env.example` as the key template. Never place live SMTP credentials in
browser JavaScript or commit them to the repository. Redeploy after changing
Vercel environment variables.

## Before launch (client to-dos)
- Hero video: drop a licensed Statue of Liberty / NYC skyline clip into the `<video class="hero-media">` src on index.html (the animated illustration is the placeholder).
- Connect the forms to a CRM (Zoho/HubSpot) — see `data-lead` forms in main.js.
- Add leadership photos + real testimonials (with consent); confirm the exact email spelling.
- Fonts (Lora + Poppins) load from Google Fonts.

## Brand
Navy #16233f · Gold #c9a24b · Ivory #faf6ec · Slate #5a6572 · Lora (headings) + Poppins (body).
