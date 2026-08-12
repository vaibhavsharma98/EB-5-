const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const publicPages = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html") && name !== "404.html");
const forbiddenClaims = [
  "October 2026",
  "tier-1",
  "India: #2",
  "500+ Families",
  "nearly doubled",
  "No Hidden Charges",
  "Exclusive Investor Privileges",
  "Exclusive USA Real Estate Advisory",
  "40+ Years of New York Real Estate Experience",
  "India's First",
  "Accredited Member",
  "placeholder testimonials",
];

for (const page of publicPages) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, "");
  assert.match(source, /<title>[\s\S]*?<\/title>/i, `${page} needs a title`);
  assert.match(source, /name="description"/i, `${page} needs a description`);
  assert.match(source, /rel="canonical"/i, `${page} needs a canonical URL`);
  assert.match(source, /href="privacy\.html"/i, `${page} needs a privacy link`);
  assert.match(source, /href="disclosures\.html"/i, `${page} needs a disclosure link`);
  assert.equal((source.match(/<h1\b/gi) || []).length, 1, `${page} needs exactly one h1`);
  assert.match(source, /class="brand-calculus">CALCULUS<\/span>/i, `${page} needs the card-style footer wordmark`);
  assert.match(source, /The key to your American dream/i, `${page} needs the approved brand tagline`);
  assert.ok(!source.includes("Experience. Trust. Global Vision."), `${page} contains the retired tagline`);

  for (const claim of forbiddenClaims) {
    assert.ok(!withoutComments.includes(claim), `${page} contains launch-blocking claim: ${claim}`);
  }

  const refs = [...withoutComments.matchAll(/(?:href|src)="([^"#?]+)"/gi)]
    .map((match) => match[1])
    .filter((ref) => !/^(?:https?:|mailto:|tel:|data:|\/)/i.test(ref));
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(root, ref)), `${page} has missing local reference: ${ref}`);
  }
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const page of publicPages) {
  const expected = page === "index.html" ? "https://thecalculusgroup.com/" : `https://thecalculusgroup.com/${page}`;
  assert.ok(sitemap.includes(expected), `sitemap.xml is missing ${page}`);
}

const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
assert.match(robots, /Sitemap:\s+https:\/\/thecalculusgroup\.com\/sitemap\.xml/i);

const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const homeStyles = fs.readFileSync(path.join(root, "home.css"), "utf8");
const scripts = fs.readFileSync(path.join(root, "scripts.js"), "utf8");
assert.match(
  styles,
  /\.access-card\s*\{[\s\S]*?max-height:\s*calc\(100dvh\s*-\s*48px\);[\s\S]*?overflow-y:\s*auto;/,
  "Journey access dialog must remain scrollable at every viewport height",
);
assert.match(
  styles,
  /\.menu-extra\s*\{\s*display:\s*block;/,
  "Services and FAQs must remain discoverable in the primary navigation",
);
assert.match(
  styles,
  /\.brand \.nm\s*\{\s*display:\s*none;/,
  "The full wordmark must remain removed from the top navigation",
);
assert.match(styles, /Bodoni Moda/, "The footer wordmark must use the business-card type style");
assert.match(
  homeStyles,
  /@media\s*\(max-width:\s*900px\)[\s\S]*?\.home-short \.journey-home ~ section:not\(\.ctaband\)\s*\{\s*display:\s*none;/,
  "Homepage shortening must remain limited to the mobile breakpoint",
);
assert.match(
  homeStyles,
  /\.home-short \.micro-trust\s*\{[\s\S]*?background:\s*#fff;/,
  "The mobile credential band must visually separate the hero from the next section",
);
assert.match(
  homeStyles,
  /\.home-short \.hero-scrim\s*\{[\s\S]*?rgba\(38,\s*96,\s*156,\s*0\.26\)/,
  "The mobile hero must preserve visible Statue of Liberty detail",
);
assert.match(
  homeStyles,
  /\.home-short \.stats\s*\{\s*background:\s*#eaf1f7;/,
  "Mobile statistics must not continue the hero's blue surface",
);
assert.doesNotMatch(
  scripts,
  /sessionStorage[\s\S]*?tcJourneyAccessGranted|tcJourneyAccessGranted[\s\S]*?sessionStorage/,
  "Journey access must not be bypassed by an earlier browser-session grant",
);

const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const securityHeaders = new Map(
  vercel.headers.flatMap((rule) => rule.headers).map((header) => [header.key.toLowerCase(), header.value]),
);
for (const required of [
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
]) {
  assert.ok(securityHeaders.has(required), `vercel.json is missing ${required}`);
}

console.log(`Site integrity tests passed for ${publicPages.length} public pages.`);
