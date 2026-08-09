const assert = require("node:assert/strict");
const nodemailer = require("nodemailer");
const handler = require("../api/journey-access");

function callApi(method, body) {
  return new Promise((resolve) => {
    handler(
      { method, body },
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

async function run() {
  const wrongMethod = await callApi("GET", {});
  assert.equal(wrongMethod.statusCode, 405);

  const invalid = await callApi("POST", {
    email: "invalid",
    countryCode: "+91",
    phone: "123",
  });
  assert.equal(invalid.statusCode, 400);

  const validLead = {
    email: "investor@example.com",
    countryCode: "+91",
    phone: "9876543210",
  };
  const missingConfig = await callApi("POST", validLead);
  assert.equal(missingConfig.statusCode, 503);

  Object.assign(process.env, {
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "465",
    SMTP_SECURE: "true",
    SMTP_USER: "test-user",
    SMTP_PASS: "test-password",
    SMTP_FROM: "The Calculus <website@example.com>",
    SMTP_TO: "advisor@example.com",
  });

  let sentMessage;
  nodemailer.createTransport = () => ({
    async sendMail(message) {
      sentMessage = message;
    },
  });

  const accepted = await callApi("POST", validLead);
  assert.equal(accepted.statusCode, 200);
  assert.equal(accepted.data.ok, true);
  assert.equal(sentMessage.replyTo, validLead.email);
  assert.match(sentMessage.text, /\+91 9876543210/);

  console.log("Journey access API tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
