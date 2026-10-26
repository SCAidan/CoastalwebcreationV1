(() => {
  const $ = (s) => document.querySelector(s),
    esc = (s) =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  let data,
    selected = "";
  const date = (s) =>
    s
      ? new Date(s.length === 10 ? s + "T12:00:00" : s).toLocaleDateString(
          undefined,
          { month: "short", day: "numeric", year: "numeric" },
        )
      : "";
  function status(t, error = false) {
    $("#status").textContent = t;
    $("#status").className = "status" + (error ? " error" : "");
  }
  async function api(body) {
    const r = await fetch(
      "/api/portal",
      body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {},
    );
    const d = await r.json();
    if (r.status === 401) {
      location.replace("/login/");
      throw Error("Please sign in.");
    }
    if (!r.ok) throw Error(d.error || "Connection failed.");
    return d;
  }
  function paint() {
    const p = data.projects.find((p) => p.id === selected) || data.projects[0];
    selected = p?.id || "";
    $("#project").innerHTML =
      data.projects
        .map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`)
        .join("") || "<option>No projects yet</option>";
    $("#project").value = selected;
    $("#request-form").querySelector("button").disabled = !p;
    $("#request-form").hidden = !p;
    if (!p) {
      $("#project-details").innerHTML =
        '<div class="empty">Your account is ready. Aidan will add your project here soon.</div>';
      $("#request-list").innerHTML =
        '<div class="empty">Project updates and requests will appear here.</div>';
      $("#request-count").textContent = "0";
      return;
    }
    const steps = [
        "Discovery",
        "Design",
        "Review",
        "Ready to launch",
        "Launched",
      ],
      step = steps.indexOf(p.status);
    let site = "";
    try {
      if (new URL(p.website_url).protocol === "https:")
        site = `<p><a href="${esc(p.website_url)}" target="_blank" rel="noopener noreferrer">Visit your website ↗</a></p>`;
    } catch {}
    $("#project-details").innerHTML =
      `<div class="row"><h2>${esc(p.name)}</h2><span class="badge">${esc(p.status)}</span></div><ol class="progress" aria-label="Project progress">${steps.map((s, i) => `<li class="${i <= step ? "done" : ""}" ${i === step ? 'aria-current="step"' : ""}>${esc(s)}</li>`).join("")}</ol><div class="next-step"><span class="eyebrow">What’s next</span><p>${esc(p.next_step || "Aidan will post the next update here.")}</p>${p.due_date ? `<small>Target date · ${esc(date(p.due_date))}</small>` : ""}</div>${site}`;
    const requests = data.requests.filter((r) => r.project_id === selected);
    $("#request-count").textContent = requests.length + " total";
    $("#request-list").innerHTML =
      requests
        .map(
          (r) =>
            `<article class="request-item"><div class="row"><h3>${esc(r.title)}</h3><span class="badge">${esc(r.status)}</span></div><small>${esc(date(r.created_at))}</small><p>${esc(r.body)}</p>${r.owner_reply ? `<div class="reply"><b>Aidan’s reply</b><p>${esc(r.owner_reply)}</p></div>` : "<small>Received. Aidan will review your request.</small>"}</article>`,
        )
        .join("") ||
      '<div class="empty">No requests yet. Have an update in mind? Use the form to send it over.</div>';
  }
  async function load() {
    data = await api();
    if (data.role === "owner") {
      location.replace("/dashboard/");
      return;
    }
    $("#welcome").textContent =
      (data.accounts[0]?.business_name || "Your") + " workspace.";
    paint();
    $("#loading").hidden = true;
    $("#app").hidden = false;
  }
  $("#project").onchange = (e) => {
    selected = e.target.value;
    paint();
  };
  $("#request-form").onsubmit = async (e) => {
    e.preventDefault();
    const b = e.target.querySelector("button");
    b.disabled = true;
    status("Sending your request…");
    try {
      await api({
        action: "request",
        project_id: selected,
        ...Object.fromEntries(new FormData(e.target)),
      });
      e.target.reset();
      await load();
      status("Request received. You’ll see Aidan’s reply here.");
    } catch (err) {
      status(err.message, true);
    } finally {
      b.disabled = false;
    }
  };
  $("#logout").onclick = async () => {
    try {
      const r = await fetch("/api/session", { method: "DELETE" });
      if (!r.ok) throw Error("Sign-out failed. Please try again.");
      data = null;
      $("#app").remove();
      location.replace("/login/");
    } catch (err) {
      status(err.message, true);
    }
  };
  load().catch((err) => {
    $("#loading").textContent =
      err.message + " Return to the login page to try again.";
    const a = document.createElement("a");
    a.href = "/login/";
    a.textContent = " Sign in";
    $("#loading").append(a);
  });
})();
