import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";

import contactHandler from "../api/contact.js";

const originalFetch = globalThis.fetch;
const originalEnvironment = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
  CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
  CONTACT_ALLOWED_ORIGINS: process.env.CONTACT_ALLOWED_ORIGINS,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
};
let requestSequence = 10;

function contactRequest(body, headers = {}) {
  return new Request("https://www.recachoadvisory.com/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://www.recachoadvisory.com",
      "X-Forwarded-For": `203.0.113.${requestSequence++}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function validBody(overrides = {}) {
  return {
    name: "Test Visitor",
    email: "visitor@example.test",
    company: "Example Company",
    message: "We need to clarify our positioning before an upcoming launch.",
    faxNumber: "",
    startedAt: Date.now() - 5_000,
    submissionId: "12345678-1234-4123-8123-123456789012",
    page: "/",
    ...overrides,
  };
}

beforeEach(() => {
  process.env.RESEND_API_KEY = "test-api-key";
  process.env.CONTACT_TO_EMAIL = "private-recipient@example.test";
  process.env.CONTACT_FROM_EMAIL = "Website <sender@example.test>";
  process.env.CONTACT_ALLOWED_ORIGINS =
    "https://www.recachoadvisory.com";
  process.env.VERCEL_ENV = "production";
  delete process.env.VERCEL_BRANCH_URL;
});

after(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("rejects requests from an unapproved origin", async () => {
  const response = await contactHandler.fetch(
    contactRequest(validBody(), { Origin: "https://example.test" }),
  );
  assert.equal(response.status, 403);
});

test("silently accepts honeypot submissions without sending", async () => {
  let providerCalled = false;
  globalThis.fetch = async () => {
    providerCalled = true;
    return new Response(null, { status: 200 });
  };

  const response = await contactHandler.fetch(
    contactRequest(validBody({ faxNumber: "bot content" })),
  );

  assert.equal(response.status, 200);
  assert.equal(providerCalled, false);
});

test("accepts Vercel's stable branch preview origin", async () => {
  process.env.VERCEL_BRANCH_URL =
    "recacho-advisory-git-feature-team.vercel.app";

  const response = await contactHandler.fetch(
    contactRequest(validBody({ faxNumber: "bot content" }), {
      Origin: "https://recacho-advisory-git-feature-team.vercel.app",
    }),
  );

  assert.equal(response.status, 200);
});

test("rejects invalid contact data", async () => {
  const response = await contactHandler.fetch(
    contactRequest(validBody({ email: "not-an-email", message: "Too short" })),
  );
  assert.equal(response.status, 400);
});

test("requires server-only delivery configuration", async () => {
  delete process.env.CONTACT_TO_EMAIL;
  const response = await contactHandler.fetch(contactRequest(validBody()));
  assert.equal(response.status, 503);
});

test("sends validated inquiries only to the configured recipient", async () => {
  let outboundRequest;
  globalThis.fetch = async (url, options) => {
    outboundRequest = { url, options };
    return new Response(JSON.stringify({ id: "email_test" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const response = await contactHandler.fetch(contactRequest(validBody()));
  const outboundBody = JSON.parse(outboundRequest.options.body);

  assert.equal(response.status, 200);
  assert.equal(outboundRequest.url, "https://api.resend.com/emails");
  assert.deepEqual(outboundBody.to, ["private-recipient@example.test"]);
  assert.equal(outboundBody.reply_to, "visitor@example.test");
  assert.match(
    outboundRequest.options.headers.Authorization,
    /^Bearer test-api-key$/,
  );
  assert.match(
    outboundRequest.options.headers["Idempotency-Key"],
    /^website-contact-/,
  );
});
