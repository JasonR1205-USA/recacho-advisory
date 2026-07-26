window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

window.getContactAddress = () => {
  const [localPart, domain, suffix] = ["hello", "recachoadvisory", "com"];
  return `${localPart}@${domain}.${suffix}`;
};

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

  document.querySelectorAll("[data-contact-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const subject = encodeURIComponent(link.dataset.contactSubject || "");
      const body = encodeURIComponent(link.dataset.contactBody || "");
      window.location.href = `mailto:${window.getContactAddress()}?subject=${subject}&body=${body}`;
    });
  });

  document.querySelectorAll("[data-copy-contact]").forEach((button) => {
    button.addEventListener("click", async () => {
      const status = document.getElementById(button.getAttribute("aria-describedby"));
      try {
        await navigator.clipboard.writeText(window.getContactAddress());
        status.textContent = "Email address copied.";
        gtag("event", "cta_email_copy", { event_category: "engagement" });
      } catch (error) {
        status.textContent = "Copy was blocked. Use a contact button to open your email app.";
      }
    });
  });

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
