(() => {
  try {
    const r = JSON.parse(sessionStorage.getItem("coastal-inquiry-receipt"));
    if (
      r &&
      typeof r.id === "string" &&
      Date.now() - r.at >= 0 &&
      Date.now() - r.at < 600000
    ) {
      document.querySelector("#heading").textContent =
        "Thanks. You’re on my radar.";
      document.querySelector("#message").textContent =
        "Your inquiry has been received. I’ll review your project details and get back to you by email. Looking forward to hearing more. — Aidan";
      document.querySelector("#next").href = "/#work";
      document.querySelector("#next").textContent = "Explore recent work →";
    }
  } catch {}
})();
