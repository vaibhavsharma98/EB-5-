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
