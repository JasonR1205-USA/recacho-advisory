document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("diagnostic-application");
  const submitButton = document.getElementById("diagnostic-submit");
  const startedAt = document.getElementById("diagnostic-started-at");
  const status = document.getElementById("application-status");

  if (!form || !submitButton || !startedAt || !status) return;

  /* ---- Field-error helpers ---- */

  const errorMessages = {
    name: "Please enter your name.",
    email: "Please enter a valid work email address.",
    company: "Please enter your company name.",
    website: "Please include https:// before your domain.",
    stage: "Please select a company stage.",
    decision_deadline: "Please select a decision deadline.",
    decision: "Please describe the decision your company needs to make.",
    decision_risk: "Please describe what happens if the company gets it wrong.",
    evidence_readiness: "Please select your evidence readiness.",
    consent: "Please confirm you understand the terms.",
  };

  function getOrCreateErrorSpan(field) {
    const parent = field.closest("label") || field.parentElement;
    let span = parent?.querySelector(".field-error");
    if (!span) {
      span = document.createElement("span");
      span.className = "field-error";
      span.setAttribute("aria-live", "polite");
      if (field.type === "checkbox") {
        parent?.appendChild(span);
      } else {
        field.insertAdjacentElement("afterend", span);
      }
    }
    return span;
  }

  function showFieldError(field, message) {
    field.setAttribute("aria-invalid", "true");
    field.setCustomValidity(message);
    const span = getOrCreateErrorSpan(field);
    span.textContent = message;
  }

  function clearFieldError(field) {
    field.removeAttribute("aria-invalid");
    field.setCustomValidity("");
    const span = getOrCreateErrorSpan(field);
    span.textContent = "";
  }

  function clearAllErrors() {
    form.querySelectorAll("[aria-invalid]").forEach((f) => {
      f.removeAttribute("aria-invalid");
      f.setCustomValidity("");
    });
    form.querySelectorAll(".field-error").forEach((span) => {
      span.textContent = "";
    });
  }

  /* ---- URL helpers ---- */

  const bareDomainPattern = /^[\w.-]+\.[a-z]{2,}/i;
  const protocolPattern = /^https?:\/\//i;

  function normalizeWebsiteValue(input) {
    const v = input.value.trim();
    if (v && !protocolPattern.test(v) && bareDomainPattern.test(v)) {
      input.value = "https://" + v;
    }
  }

  /* ---- Auto-prepend https:// on blur ---- */

  const websiteInput = form.querySelector('input[name="website"]');
  if (websiteInput) {
    websiteInput.addEventListener("blur", () => {
      normalizeWebsiteValue(websiteInput);
      if (websiteInput.getAttribute("aria-invalid") === "true") {
        const v = websiteInput.value.trim();
        if (v && protocolPattern.test(v)) {
          clearFieldError(websiteInput);
        }
      }
    });
  }

  /* ---- Clear errors on input / change ---- */

  form.addEventListener("input", (e) => {
    const field = e.target;
    if (field.getAttribute("aria-invalid") !== "true") return;

    if (field.name === "website") {
      const v = field.value.trim();
      if (v && (protocolPattern.test(v) || bareDomainPattern.test(v))) {
        clearFieldError(field);
      }
    } else {
      field.setCustomValidity("");
      if (field.validity.valid) {
        clearFieldError(field);
      }
    }
  });

  form.addEventListener("change", (e) => {
    const field = e.target;
    if (field.getAttribute("aria-invalid") !== "true") return;

    if (field.name === "website") {
      normalizeWebsiteValue(field);
      const v = field.value.trim();
      if (v && protocolPattern.test(v)) {
        clearFieldError(field);
      }
    } else {
      field.setCustomValidity("");
      if (field.validity.valid) {
        clearFieldError(field);
      }
    }
  });

  /* ---- Symptoms helper ---- */

  function selectedSymptoms() {
    return Array.from(
      form.querySelectorAll('input[name="symptoms"]:checked'),
      (input) => input.value,
    );
  }

  /* ---- Validation ---- */

  function validateApplication() {
    let firstInvalid = null;

    const fields = form.querySelectorAll(
      "input:not([type='hidden']):not([type='checkbox']), select, textarea",
    );

    for (const field of fields) {
      field.setCustomValidity("");

      if (!field.required) continue;

      if (field.name === "website") {
        normalizeWebsiteValue(field);
        const v = field.value.trim();
        if (!v) {
          showFieldError(field, "Please enter your company website.");
          if (!firstInvalid) firstInvalid = field;
          continue;
        }
        if (!protocolPattern.test(v)) {
          showFieldError(field, "Please include https:// before your domain.");
          if (!firstInvalid) firstInvalid = field;
          continue;
        }
        clearFieldError(field);
        continue;
      }

      if (!field.validity.valid) {
        showFieldError(field, errorMessages[field.name] || "This field is required.");
        if (!firstInvalid) firstInvalid = field;
      } else {
        clearFieldError(field);
      }
    }

    const consent = form.querySelector('input[name="consent"]');
    if (consent && !consent.checked) {
      showFieldError(consent, errorMessages.consent);
      if (!firstInvalid) firstInvalid = consent;
    } else if (consent) {
      clearFieldError(consent);
    }

    if (selectedSymptoms().length === 0) {
      status.textContent = "Select at least one current revenue signal.";
      status.dataset.state = "error";
      if (!firstInvalid) {
        firstInvalid = form.querySelector('input[name="symptoms"]');
      }
    }

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalid.focus({ preventScroll: true });
      return false;
    }

    return true;
  }

  /* ---- Build application text ---- */

  function buildApplicationText() {
    const data = new FormData(form);
    const symptoms = selectedSymptoms();

    return [
      "Revenue Architecture Diagnostic application",
      "",
      `Name: ${data.get("name") || ""}`,
      `Work email: ${data.get("email") || ""}`,
      `Company: ${data.get("company") || ""}`,
      `Website: ${data.get("website") || ""}`,
      `Company stage: ${data.get("stage") || ""}`,
      `Decision deadline: ${data.get("decision_deadline") || ""}`,
      "",
      "The decision we need to make:",
      data.get("decision") || "",
      "",
      "What happens if we get it wrong:",
      data.get("decision_risk") || "",
      "",
      `Current signals: ${symptoms.length ? symptoms.join("; ") : "None selected"}`,
      `Evidence readiness: ${data.get("evidence_readiness") || ""}`,
      "",
      "Additional context:",
      data.get("context") || "None provided",
      "",
      "I understand that this application does not submit confidential files,",
      "and that the $2,500 fixed fee is invoiced only after fit is confirmed.",
    ].join("\n");
  }

  /* ---- Submission ---- */

  function resetSubmissionTimer() {
    startedAt.value = String(Date.now());
  }

  resetSubmissionTimer();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateApplication()) return;

    const data = new FormData(form);
    const company = String(data.get("company") || "Company").trim();
    const submissionId = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      company,
      message: buildApplicationText(),
      faxNumber: String(data.get("fax_number") || ""),
      startedAt: Number(data.get("started_at")),
      submissionId,
      page: window.location.pathname,
      inquiryType: "diagnostic",
    };

    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    status.dataset.state = "";
    status.textContent = "Submitting your application securely…";
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        status.dataset.state = "error";
        status.textContent =
          typeof result.message === "string" && result.message
            ? result.message
            : "Your application could not be sent right now. Please try again.";
        return;
      }

      form.reset();
      clearAllErrors();
      resetSubmissionTimer();
      status.dataset.state = "success";
      status.textContent =
        "Thank you. Your application was sent successfully. Expect a fit response within two business days.";
      window.gtag?.("event", "diagnostic_application_submit", {
        event_category: "conversion",
        event_label: company,
      });
    } catch (error) {
      status.dataset.state = "error";
      status.textContent =
        error.name === "AbortError"
          ? "Submitting took too long. Please try again."
          : "Your application could not be sent right now. Please try again.";
    } finally {
      window.clearTimeout(timeoutId);
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
    }
  });
});
