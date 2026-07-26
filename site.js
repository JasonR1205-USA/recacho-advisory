window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

const productionHosts = ["recachoadvisory.com", "www.recachoadvisory.com"];
const isProduction = productionHosts.includes(window.location.hostname);

if (isProduction) {
  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = "https://www.googletagmanager.com/gtag/js?id=G-9CSV64G72Z";
  document.head.appendChild(analyticsScript);
  gtag("js", new Date());
  gtag("config", "G-9CSV64G72Z");
}

document.addEventListener("DOMContentLoaded", () => {
  const bar = document.getElementById("bar");
  const hero = document.querySelector(".hero");
  const onScroll = () => bar?.classList.toggle("scrolled", window.scrollY > 20);

  hero?.classList.add("run");
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  document.querySelectorAll("[data-event]").forEach((element) => {
    element.addEventListener("click", () => {
      gtag("event", element.dataset.event, {
        event_category: element.dataset.category || "engagement",
        event_label: element.dataset.label || element.textContent.trim(),
      });
    });
  });

  document.querySelectorAll(".case-head").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", open ? "true" : "false");
      panel.hidden = !open;
      button.closest(".case").classList.toggle("open", open);

      if (open) {
        gtag("event", "case_expand", {
          event_category: "engagement",
          event_label: button.querySelector(".ttl")?.textContent.trim() || "unknown",
        });
      }
    });
  });

  const moreButton = document.getElementById("moreBtn");
  const moreCases = document.getElementById("moreCases");
  moreButton?.addEventListener("click", () => {
    const show = moreCases.hidden;
    moreCases.hidden = !show;
    moreButton.setAttribute("aria-expanded", show ? "true" : "false");
    moreButton.textContent = show
      ? "Show fewer systems −"
      : "Show 3 additional systems +";
    if (show) {
      gtag("event", "more_cases_expand", { event_category: "engagement" });
    }
  });

  const contactForm = document.getElementById("contactForm");
  const contactSubmit = document.getElementById("contactSubmit");
  const contactStatus = document.getElementById("contactStatus");
  const contactStartedAt = document.getElementById("contactStartedAt");

  if (contactForm && contactSubmit && contactStatus && contactStartedAt) {
    const inquiryTemplates = {
      leadership: [
        "I’d like to discuss a product marketing leadership opportunity.",
        "",
        "Role:",
        "Business context:",
        "Timing:",
      ].join("\n"),
      resume: [
        "Please send me your current résumé.",
        "",
        "Role:",
        "Business context:",
        "Timing:",
      ].join("\n"),
    };
    const inquiryType = new URLSearchParams(window.location.search).get("inquiry");
    const messageField = contactForm.elements.namedItem("message");
    if (
      messageField instanceof HTMLTextAreaElement &&
      inquiryType &&
      inquiryTemplates[inquiryType]
    ) {
      messageField.value = inquiryTemplates[inquiryType];
    }

    const resetContactTimer = () => {
      contactStartedAt.value = String(Date.now());
    };
    resetContactTimer();

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      const formData = new FormData(contactForm);
      const submissionId = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      const payload = {
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        company: String(formData.get("company") || ""),
        message: String(formData.get("message") || ""),
        faxNumber: String(formData.get("fax_number") || ""),
        startedAt: Number(formData.get("started_at")),
        submissionId,
        page: `${window.location.pathname}${window.location.search}`,
      };

      contactSubmit.disabled = true;
      contactSubmit.setAttribute("aria-busy", "true");
      contactStatus.dataset.state = "";
      contactStatus.textContent = "Sending your inquiry securely…";
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
          contactStatus.dataset.state = "error";
          contactStatus.textContent =
            typeof result.message === "string" && result.message
              ? result.message
              : "Your inquiry could not be sent right now. Please try again or connect on LinkedIn.";
          return;
        }

        contactForm.reset();
        resetContactTimer();
        contactStatus.dataset.state = "success";
        contactStatus.textContent = "Thank you. Your inquiry was sent successfully.";
        gtag("event", "contact_form_submit", {
          event_category: "conversion",
          event_label: inquiryType || "advisory",
        });
      } catch (error) {
        contactStatus.dataset.state = "error";
        contactStatus.textContent =
          error.name === "AbortError"
            ? "Sending took too long. Please try again."
            : "Your inquiry could not be sent right now. Please try again or connect on LinkedIn.";
      } finally {
        window.clearTimeout(timeoutId);
        contactSubmit.disabled = false;
        contactSubmit.removeAttribute("aria-busy");
      }
    });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.03 },
    );
    document.querySelectorAll(".rv").forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll(".rv").forEach((element) => element.classList.add("in"));
  }

  const loadPendo = () => {
    if (window.pendo || !isProduction) return;

    ((apiKey) => {
      ((p, e, n, d, o) => {
        let v;
        let w;
        let x;
        let y;
        let z;
        o = p[d] = p[d] || {};
        o._q = o._q || [];
        v = ["initialize", "identify", "updateOptions", "pageLoad", "track", "trackAgent"];
        for (w = 0, x = v.length; w < x; ++w) {
          ((method) => {
            o[method] =
              o[method] ||
              function queuePendoCall() {
                o._q[method === v[0] ? "unshift" : "push"](
                  [method].concat([].slice.call(arguments, 0)),
                );
              };
          })(v[w]);
        }
        y = e.createElement(n);
        y.async = true;
        y.src = `https://cdn.pendo.io/agent/static/${apiKey}/pendo.js`;
        z = e.getElementsByTagName(n)[0];
        z.parentNode.insertBefore(y, z);
      })(window, document, "script", "pendo");
    })("1cc3f16d-992f-4918-b6b9-80ccb0622706");

    window.pendo.initialize({ visitor: { id: "" } });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadPendo, { timeout: 4000 });
  } else {
    window.setTimeout(loadPendo, 3000);
  }
});
