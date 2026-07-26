document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("diagnostic-application");
  const submitButton = document.getElementById("diagnostic-submit");
  const startedAt = document.getElementById("diagnostic-started-at");
  const status = document.getElementById("application-status");

  if (!form || !submitButton || !startedAt || !status) return;

  function selectedSymptoms() {
    return Array.from(
      form.querySelectorAll('input[name="symptoms"]:checked'),
      (input) => input.value,
    );
  }

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
      "and that the engagement fee is confirmed in writing only after fit is confirmed.",
    ].join("\n");
  }

  function validateApplication() {
    if (!form.reportValidity()) return false;

    if (selectedSymptoms().length === 0) {
      status.textContent = "Select at least one current revenue signal.";
      status.dataset.state = "error";
      form.querySelector('input[name="symptoms"]')?.focus();
      return false;
    }

    return true;
  }

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
