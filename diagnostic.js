document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("diagnostic-application");
  const copyButton = document.getElementById("copy-application");
  const status = document.getElementById("application-status");

  if (!form || !status) return;

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
      "and that the $2,500 fixed fee is invoiced only after fit is confirmed.",
    ].join("\n");
  }

  function validateApplication() {
    if (!form.reportValidity()) return false;

    if (selectedSymptoms().length === 0) {
      status.textContent = "Select at least one current revenue signal.";
      form.querySelector('input[name="symptoms"]')?.focus();
      return false;
    }

    return true;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateApplication()) return;

    const data = new FormData(form);
    const company = String(data.get("company") || "Company").trim();
    const subject = `Revenue Architecture Diagnostic application — ${company}`;
    const body = buildApplicationText();
    const href = `mailto:${window.getContactAddress()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    status.textContent = "Opening your email app with the completed application.";
    window.gtag?.("event", "diagnostic_application_start", {
      event_category: "conversion",
      event_label: company,
    });
    window.location.href = href;
  });

  copyButton?.addEventListener("click", async () => {
    if (!validateApplication()) return;

    try {
      await navigator.clipboard.writeText(buildApplicationText());
      status.textContent =
        "Application copied. Use the application button to open your email app.";
      window.gtag?.("event", "diagnostic_application_copy", {
        event_category: "conversion",
      });
    } catch (error) {
      status.textContent =
        "Copy was blocked. Submit the form to open the application in your email app.";
    }
  });
});
