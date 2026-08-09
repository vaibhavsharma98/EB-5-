const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COUNTRY_CODE_PATTERN = /^\+\d{1,4}$/;
const PHONE_PATTERN = /^\d{7,15}$/;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 8;
const rateBuckets = new Map();
let graphAccessToken = "";
let graphAccessTokenExpiresAt = 0;

function clean(value, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clientIp(request) {
  const forwarded = request.headers && request.headers["x-forwarded-for"];
  return clean(Array.isArray(forwarded) ? forwarded[0] : forwarded, 100)
    .split(",")[0]
    .trim() || "unknown";
}

function allowRequest(request) {
  const now = Date.now();
  const ip = clientIp(request);
  const recent = (rateBuckets.get(ip) || []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );
  recent.push(now);
  rateBuckets.set(ip, recent);

  for (const [key, timestamps] of rateBuckets) {
    if (!timestamps.some((timestamp) => now - timestamp < RATE_WINDOW_MS)) {
      rateBuckets.delete(key);
    }
  }

  return recent.length <= RATE_LIMIT;
}

function trustedOrigin(request) {
  const expected = clean(process.env.SITE_ORIGIN, 300).replace(/\/$/, "");
  const origin = clean(request.headers && request.headers.origin, 300).replace(
    /\/$/,
    "",
  );
  if (!origin) return true;

  try {
    const requestHost = clean(request.headers && request.headers.host, 300);
    if (requestHost && new URL(origin).host === requestHost) return true;
  } catch {
    return false;
  }

  return !expected || expected === origin;
}

function requiredEnvironment() {
  return [
    "MS_TENANT_ID",
    "MS_CLIENT_ID",
    "MS_CLIENT_SECRET",
    "MS_SENDER_EMAIL",
    "LEAD_TO_EMAIL",
  ].filter((name) => !process.env[name]);
}

function validateCommon(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed." });
    return null;
  }
  if (!trustedOrigin(request)) {
    response.status(403).json({ error: "Request origin was not accepted." });
    return null;
  }
  if (!allowRequest(request)) {
    response.status(429).json({
      error: "Too many requests. Please wait before trying again.",
    });
    return null;
  }

  const body = request.body && typeof request.body === "object" ? request.body : {};
  if (clean(body.website, 200)) {
    response.status(200).json({ ok: true });
    return null;
  }

  const openedAt = Number(body.openedAt);
  const elapsed = Date.now() - openedAt;
  if (!Number.isFinite(openedAt) || elapsed < 1200 || elapsed > 86400000) {
    response.status(400).json({ error: "Please refresh the page and try again." });
    return null;
  }
  if (body.consent !== true) {
    response.status(400).json({ error: "Consent is required before submitting." });
    return null;
  }
  return body;
}

async function graphToken() {
  if (graphAccessToken && Date.now() < graphAccessTokenExpiresAt) {
    return graphAccessToken;
  }

  const tenantId = encodeURIComponent(process.env.MS_TENANT_ID);
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );

  if (!tokenResponse.ok) {
    throw new Error(`Microsoft identity token request failed (${tokenResponse.status}).`);
  }

  const token = await tokenResponse.json();
  if (!token.access_token) {
    throw new Error("Microsoft identity response did not include an access token.");
  }

  graphAccessToken = token.access_token;
  const lifetimeSeconds = Number(token.expires_in) || 3600;
  graphAccessTokenExpiresAt = Date.now() + Math.max(lifetimeSeconds - 120, 60) * 1000;
  return graphAccessToken;
}

function graphRecipients(value) {
  return value
    .split(",")
    .map((address) => address.trim().toLowerCase())
    .filter((address) => EMAIL_PATTERN.test(address))
    .map((address) => ({ emailAddress: { address } }));
}

async function sendGraphMail(message, retry = true) {
  const sender = process.env.MS_SENDER_EMAIL.trim().toLowerCase();
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await graphToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, saveToSentItems: true }),
    },
  );

  if (response.status === 401 && retry) {
    graphAccessToken = "";
    graphAccessTokenExpiresAt = 0;
    return sendGraphMail(message, false);
  }
  if (!response.ok) {
    throw new Error(`Microsoft Graph sendMail failed (${response.status}).`);
  }
}

async function deliver(response, lead) {
  const missing = requiredEnvironment();
  if (missing.length) {
    console.error("Lead email is not configured:", missing.join(", "));
    return response
      .status(503)
      .json({ error: "The enquiry service is temporarily unavailable." });
  }

  const rows = lead.rows.filter((row) => row[1]);
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  try {
    const toRecipients = graphRecipients(process.env.LEAD_TO_EMAIL);
    if (!EMAIL_PATTERN.test(process.env.MS_SENDER_EMAIL) || !toRecipients.length) {
      throw new Error("Microsoft Graph sender or recipient configuration is invalid.");
    }
    await sendGraphMail({
      subject: lead.subject,
      body: {
        contentType: "HTML",
        content: `<h2>${escapeHtml(lead.subject)}</h2><p>${escapeHtml(lead.intro)}</p><table cellpadding="6" cellspacing="0" border="0">${htmlRows}<tr><td><strong>Submitted</strong></td><td>${new Date().toISOString()}</td></tr></table>`,
      },
      toRecipients,
      replyTo: [{ emailAddress: { address: lead.replyTo } }],
    });
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Lead email delivery failed:", error && error.message);
    return response.status(502).json({ error: "Unable to send the enquiry." });
  }
}

async function handleJourney(request, response) {
  const body = validateCommon(request, response);
  if (!body) return;

  const email = clean(body.email, 254).toLowerCase();
  const countryCode = clean(body.countryCode, 6);
  const phone = clean(body.phone, 30).replace(/\D/g, "");
  if (!EMAIL_PATTERN.test(email)) {
    return response.status(400).json({ error: "A valid email address is required." });
  }
  if (!COUNTRY_CODE_PATTERN.test(countryCode) || !PHONE_PATTERN.test(phone)) {
    return response.status(400).json({ error: "A valid phone number is required." });
  }

  return deliver(response, {
    subject: "New EB-5 journey access request",
    intro: "A visitor shared their details to view the EB-5 journey.",
    replyTo: email,
    rows: [
      ["Email", email],
      ["Phone", `${countryCode} ${phone}`],
    ],
  });
}

async function handleLead(request, response) {
  const body = validateCommon(request, response);
  if (!body) return;

  const type = clean(body.type, 30);
  const name = clean(body.name, 100);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 30).replace(/[^\d+ ]/g, "");
  if (!['contact', 'eligibility'].includes(type)) {
    return response.status(400).json({ error: "Unknown enquiry type." });
  }
  if (name.length < 2 || !EMAIL_PATTERN.test(email) || phone.replace(/\D/g, "").length < 7) {
    return response.status(400).json({ error: "Valid contact details are required." });
  }

  const message = clean(body.message, 2000);
  const readiness = clean(body.readiness, 120);
  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
  const answerRows = ["readiness", "location", "goal", "timeframe"].map((key) => [
    key.charAt(0).toUpperCase() + key.slice(1),
    clean(answers[key], 150),
  ]);
  if (type === "eligibility" && answerRows.some((row) => !row[1])) {
    return response.status(400).json({ error: "Please answer every readiness question." });
  }

  return deliver(response, {
    subject:
      type === "eligibility"
        ? "New EB-5 readiness review"
        : "New EB-5 consultation enquiry",
    intro:
      type === "eligibility"
        ? "A visitor completed the preliminary EB-5 readiness questionnaire."
        : "A visitor requested an EB-5 consultation.",
    replyTo: email,
    rows: [
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Readiness", readiness],
      ...answerRows,
      ["Message", message],
    ],
  });
}

function resetRateLimits() {
  rateBuckets.clear();
}

module.exports = { handleJourney, handleLead, resetRateLimits };
