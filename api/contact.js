const MAX_BODY_BYTES = 16_384;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateBuckets = new Map();

function jsonResponse(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function allowedOrigins() {
  const origins = new Set([
    "https://www.recachoadvisory.com",
    "https://recachoadvisory.com",
  ]);

  for (const hostname of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ]) {
    if (hostname) origins.add(`https://${hostname}`);
  }

  for (const origin of (process.env.CONTACT_ALLOWED_ORIGINS || "").split(",")) {
    if (origin.trim()) origins.add(origin.trim());
  }

  return origins;
}

function isAllowedOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  if (allowedOrigins().has(origin)) return true;

  if (process.env.VERCEL_ENV !== "production") {
    return (
      origin.startsWith("http://127.0.0.1:") ||
      origin.startsWith("http://localhost:")
    );
  }

  return false;
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(value) {
  return (
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value)
  );
}

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function clientKey(request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return forwardedFor.split(",")[0].trim() || "unknown";
}

function isRateLimited(key, now = Date.now()) {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (rateBuckets.get(key) || []).filter(
    (timestamp) => timestamp > cutoff,
  );

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateBuckets.set(key, recent);
    return true;
  }

  recent.push(now);
  rateBuckets.set(key, recent);

  if (rateBuckets.size > 1_000) {
    for (const [bucketKey, timestamps] of rateBuckets) {
      if (!timestamps.some((timestamp) => timestamp > cutoff)) {
        rateBuckets.delete(bucketKey);
      }
    }
  }

  return false;
}

function contactConfiguration() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) return null;
  return { apiKey, to, from };
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return jsonResponse(
        405,
        { ok: false, message: "Method not allowed." },
        { Allow: "POST" },
      );
    }

    if (!isAllowedOrigin(request)) {
      return jsonResponse(403, {
        ok: false,
        message: "This request was not accepted.",
      });
    }

    const contentType = request.headers.get("content-type") || "";
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (
      !contentType.toLowerCase().startsWith("application/json") ||
      contentLength > MAX_BODY_BYTES
    ) {
      return jsonResponse(415, {
        ok: false,
        message: "This request format was not accepted.",
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, {
        ok: false,
        message: "The form data was not valid.",
      });
    }

    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
      return jsonResponse(413, {
        ok: false,
        message: "The form data was too large.",
      });
    }

    // Silently accept bot-filled honeypot submissions without sending email.
    if (cleanText(body.faxNumber, 200)) {
      return jsonResponse(200, { ok: true });
    }

    const now = Date.now();
    const startedAt = Number(body.startedAt);
    if (
      !Number.isFinite(startedAt) ||
      now - startedAt < 1_500 ||
      now - startedAt > 2 * 60 * 60 * 1000
    ) {
      console.info("Contact request rejected", {
        reason: "timing_validation",
      });
      return jsonResponse(400, {
        ok: false,
        message: "Please refresh the page and try again.",
      });
    }

    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 254);
    const company = cleanText(body.company, 120);
    const message = cleanText(body.message, 2_000);
    const page = cleanText(body.page, 120);
    const submissionId = cleanText(body.submissionId, 80);

    if (
      !name ||
      !isValidEmail(email) ||
      !company ||
      !message ||
      !/^[a-z0-9-]{16,80}$/i.test(submissionId)
    ) {
      console.info("Contact request rejected", {
        reason: "field_validation",
      });
      return jsonResponse(400, {
        ok: false,
        message: "Please complete every field with valid information.",
      });
    }

    if (isRateLimited(clientKey(request), now)) {
      return jsonResponse(
        429,
        {
          ok: false,
          message: "Too many attempts. Please try again in a few minutes.",
        },
        { "Retry-After": "600" },
      );
    }

    const configuration = contactConfiguration();
    if (!configuration) {
      return jsonResponse(503, {
        ok: false,
        message: "The contact service is temporarily unavailable.",
      });
    }

    const text = [
      "New Recacho Advisory website inquiry",
      "",
      `Name: ${name}`,
      `Work email: ${email}`,
      `Company: ${company}`,
      `Page: ${page || "/"}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const html = `
      <h1>New Recacho Advisory website inquiry</h1>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Work email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Company:</strong> ${escapeHtml(company)}</p>
      <p><strong>Page:</strong> ${escapeHtml(page || "/")}</p>
      <h2>Message</h2>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    `;

    let resendResponse;
    try {
      resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${configuration.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `website-contact-${submissionId}`,
        },
        body: JSON.stringify({
          from: configuration.from,
          to: [configuration.to],
          reply_to: email,
          subject: `Website inquiry — ${company}`,
          text,
          html,
        }),
      });
    } catch {
      return jsonResponse(502, {
        ok: false,
        message: "The contact service could not be reached.",
      });
    }

    if (!resendResponse.ok) {
      console.error("Contact delivery failed", {
        providerStatus: resendResponse.status,
      });
      return jsonResponse(502, {
        ok: false,
        message: "The inquiry could not be delivered.",
      });
    }

    return jsonResponse(200, { ok: true });
  },
};
