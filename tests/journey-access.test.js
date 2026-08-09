const assert = require("node:assert/strict");
const nodemailer = require("nodemailer");
const journeyHandler = require("../api/journey-access");
const leadHandler = require("../api/lead");
const { resetRateLimits } = require("../lib/lead-service");

function callApi(handler, method, body, headers = {}) {
  return new Promise((resolve) => {
    handler(
      { method, body, headers },
      {
        setHeader() {},
        status(statusCode) {
          this.statusCode = statusCode;
          return this;
        },
        json(data) {
          resolve({ statusCode: this.statusCode, data });
        },
      },
    );
  });
}

function common(overrides = {}) {
  return {
    website: "",
    consent: true,
    openedAt: Date.now() - 3000,
    ...overrides,
  };
}

async function run() {
  resetRateLimits();
  ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_TO", "SITE_ORIGIN"].forEach(
    (name) => delete process.env[name],
  );

  const wrongMethod = await callApi(journeyHandler, "GET", {});
  assert.equal(wrongMethod.statusCode, 405);

  const invalid = await callApi(
    journeyHandler,
    "POST",
    common({ email: "invalid", countryCode: "+91", phone: "123" }),
  );
  assert.equal(invalid.statusCode, 400);

  const noConsent = await callApi(
    journeyHandler,
    "POST",
    common({ consent: false, email: "investor@example.com", countryCode: "+91", phone: "9876543210" }),
  );
  assert.equal(noConsent.statusCode, 400);

  const validJourney = common({
    email: "investor@example.com",
    countryCode: "+91",
    phone: "9876543210",
  });
  const missingConfig = await callApi(journeyHandler, "POST", validJourney);
  assert.equal(missingConfig.statusCode, 503);

  process.env.SITE_ORIGIN = "https://thecalculusgroup.com";
  resetRateLimits();
  const rejectedOrigin = await callApi(journeyHandler, "POST", validJourney, {
    origin: "https://attacker.example",
    host: "thecalculusgroup.com",
  });
  assert.equal(rejectedOrigin.statusCode, 403);

  resetRateLimits();
  const previewOrigin = await callApi(journeyHandler, "POST", validJourney, {
    origin: "https://preview.example",
    host: "preview.example",
  });
  assert.equal(previewOrigin.statusCode, 503);

  Object.assign(process.env, {
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "465",
    SMTP_SECURE: "true",
    SMTP_USER: "test-user",
    SMTP_PASS: "test-password",
    SMTP_FROM: "The Calculus <website@example.com>",
    SMTP_TO: "advisor@example.com",
  });

  const sentMessages = [];
  nodemailer.createTransport = () => ({
    async sendMail(message) {
      sentMessages.push(message);
    },
  });

  const journeyAccepted = await callApi(journeyHandler, "POST", validJourney);
  assert.equal(journeyAccepted.statusCode, 200);
  assert.equal(journeyAccepted.data.ok, true);
  assert.equal(sentMessages.at(-1).replyTo, validJourney.email);
  assert.match(sentMessages.at(-1).text, /\+91 9876543210/);

  const contactAccepted = await callApi(
    leadHandler,
    "POST",
    common({
      type: "contact",
      name: "Test Investor",
      email: "investor@example.com",
      phone: "+91 9876543210",
      readiness: "Still researching",
      message: "Please call next week.",
    }),
  );
  assert.equal(contactAccepted.statusCode, 200);
  assert.match(sentMessages.at(-1).subject, /consultation/i);

  const incompleteReview = await callApi(
    leadHandler,
    "POST",
    common({
      type: "eligibility",
      name: "Test Investor",
      email: "investor@example.com",
      phone: "+91 9876543210",
      answers: { readiness: "Ready" },
    }),
  );
  assert.equal(incompleteReview.statusCode, 400);

  const reviewAccepted = await callApi(
    leadHandler,
    "POST",
    common({
      type: "eligibility",
      name: "Test Investor",
      email: "investor@example.com",
      phone: "+91 9876543210",
      answers: {
        readiness: "Ready to begin",
        location: "India",
        goal: "U.S. residency",
        timeframe: "Within 6 months",
      },
    }),
  );
  assert.equal(reviewAccepted.statusCode, 200);
  assert.match(sentMessages.at(-1).subject, /readiness/i);

  console.log("Lead API tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
