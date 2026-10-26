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
    tab = "inquiries";
  const options = (values, current) =>
      values
        .map(
          (v) =>
            `<option ${v === current ? "selected" : ""}>${esc(v)}</option>`,
        )
        .join(""),
    date = (s) => new Date(s).toLocaleDateString();
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
      location.replace("/login/?owner=1");
      throw Error("Sign in again.");
    }
    if (!r.ok) throw Error(d.error || "Unable to save.");
    return d;
  }
  const account = (id) =>
    data.accounts.find((a) => a.id === id)?.business_name || "Client";
  const project = (id) =>
    data.projects.find((p) => p.id === id)?.name || "Project";
  const field = (label, name, value = "", type = "text") =>
    `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" maxlength="${type === "email" ? 254 : 500}" ${["name", "email", "business_name"].includes(name) ? "required" : ""}></label>`;
  function projectForm(p = {}) {
    return `<form data-form="project" data-id="${p.id || ""}"><label>Client<select name="client_id" required>${data.accounts
      .filter((a) => a.active || a.id === p.client_id)
      .map(
        (a) =>
          `<option value="${esc(a.id)}" ${a.id === p.client_id ? "selected" : ""}>${esc(a.business_name)}</option>`,
      )
      .join(
        "",
      )}</select></label>${field("Project name", "name", p.name)}<div class="pair"><label>Status<select name="status">${options(["Discovery", "Design", "Review", "Ready to launch", "Launched", "On hold"], p.status)}</select></label>${field("Target date (optional)", "due_date", p.due_date, "date")}</div><label>Next step<textarea name="next_step" maxlength="2000">${esc(p.next_step)}</textarea></label>${field("Website URL (optional, HTTPS)", "website_url", p.website_url, "url")}<button class="primary">${p.id ? "Save project" : "Create project"}</button></form>`;
  }
  function paint() {
    let html = "";
    if (tab === "inquiries")
      html =
        data.inquiries
          .map(
            (i) =>
              `<article class="panel"><div class="row"><h2>${esc(i.business || i.name)}</h2><span class="badge">${esc(i.status)}</span></div><p>${esc(i.name)} · <a href="mailto:${esc(i.email)}">${esc(i.email)}</a> · ${esc(date(i.created_at))}</p><p>${esc(i.service)} website · ${esc(i.style)} direction</p><p class="inquiry-message">${esc(i.message).replace(/\n/g, "<br>")}</p><div class="actions">${!i.linked_lead ? `<button data-action="import" data-id="${i.id}">Add to owner leads</button>` : '<span class="badge">Added to leads</span>'}${!i.linked_lead ? `<button data-action="contacted" data-id="${i.id}">Mark contacted</button><button data-action="archive" data-id="${i.id}">Archive</button>` : ""}</div></article>`,
          )
          .join("") ||
        '<section class="panel empty">Website inquiries will appear here when visitors submit the contact form.</section>';
    if (tab === "accounts")
      html =
        `<section class="panel"><h2>Create client access</h2><p class="muted">Create an account and a private setup link. No email is sent automatically. Share the one-use link directly with the client; it allows them to set a password.</p><form data-form="provision"><div class="pair">${field("Business name", "business_name")}${field("Client email", "email", "", "email")}</div><button class="primary">Create account & setup link</button></form><div id="setup-result"></div></section>` +
        data.accounts
          .map(
            (a) =>
              `<section class="panel"><div class="row"><h2>${esc(a.business_name)}</h2><span class="badge">${a.active ? "Active" : "Access paused"}</span></div><p>${esc(a.email)}</p><div class="actions">${a.active ? `<button data-action="setup_link" data-id="${a.id}">New password setup link</button>` : ""}<button data-action="toggle" data-id="${a.id}">${a.active ? "Pause access" : "Restore access"}</button></div></section>`,
          )
          .join("");
    if (tab === "projects")
      html =
        `<section class="panel"><h2>Add a client project</h2>${data.accounts.some((a) => a.active) ? projectForm() : "<p>Create an active client account first.</p>"}</section>` +
        data.projects
          .map(
            (p) =>
              `<details class="panel"><summary>${esc(p.name)} · ${esc(account(p.client_id))} · ${esc(p.status)}</summary>${projectForm(p)}</details>`,
          )
          .join("");
    if (tab === "requests")
      html =
        data.requests
          .map(
            (r) =>
              `<section class="panel"><div class="row"><h2>${esc(r.title)}</h2><span class="badge">${esc(r.status)}</span></div><p class="muted">${esc(project(r.project_id))} · ${esc(date(r.created_at))}</p><p>${esc(r.body).replace(/\n/g, "<br>")}</p><form data-form="reply" data-id="${r.id}"><label>Status<select name="status">${options(["New", "In progress", "Waiting for you", "Completed"], r.status)}</select></label><label>Reply visible to the client<textarea name="owner_reply" maxlength="4000">${esc(r.owner_reply)}</textarea></label><button class="primary">Save status & reply</button></form></section>`,
          )
          .join("") ||
        '<section class="panel empty">Client change requests will appear here.</section>';
    $("#content").innerHTML = html;
    document
      .querySelectorAll("[data-tab]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.tab === tab)),
      );
  }
  async function load() {
    data = await api();
    if (data.role !== "owner") {
      location.replace("/portal/");
      return;
    }
    paint();
    $("#loading").hidden = true;
    $("#app").hidden = false;
  }
  function showLink(url) {
    let holder = $("#setup-result");
    if (!holder) {
      holder = document.createElement("div");
      $("#content").prepend(holder);
    }
    holder.className = "setup-link";
    holder.innerHTML =
      '<b>Private, one-use setup link</b><p>Share directly with this client. Anyone with this link can set the account password. Generating another link may replace the previous one.</p><label>Setup link<input readonly aria-label="Private setup link"></label><button type="button">Copy link</button>';
    holder.querySelector("input").value = url;
    holder.querySelector("button").onclick = async () => {
      try {
        await navigator.clipboard.writeText(url);
        status("Setup link copied. Share it privately with your client.");
      } catch {
        holder.querySelector("input").select();
        status("Select and copy the setup link.");
      }
    };
    holder.scrollIntoView({ behavior: "instant", block: "center" });
  }
  $("#content").addEventListener("submit", async (e) => {
    const f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    const b = f.querySelector("button");
    b.disabled = true;
    status("Saving…");
    try {
      const body = {
        ...Object.fromEntries(new FormData(f)),
        action: f.dataset.form,
        ...(f.dataset.id ? { id: f.dataset.id } : {}),
      };
      const result = await api(body);
      await load();
      status("Saved.");
      if (result.setup_url) showLink(result.setup_url);
    } catch (err) {
      status(err.message, true);
    } finally {
      b.disabled = false;
    }
  });
  $("#content").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    let body = { action: b.dataset.action, id: b.dataset.id };
    if (body.action === "toggle") {
      const a = data.accounts.find((x) => x.id === body.id);
      if (
        !confirm(
          (a.active ? "Pause" : "Restore") +
            " portal access for " +
            a.business_name +
            "?",
        )
      )
        return;
      body = { action: "account", id: a.id, active: !a.active };
    } else if (body.action === "setup_link")
      body = { action: "setup_link", client_id: body.id };
    else if (["contacted", "archive"].includes(body.action))
      body = {
        action: "inquiry",
        id: body.id,
        status: body.action === "contacted" ? "Contacted" : "Archived",
      };
    b.disabled = true;
    status("Saving…");
    try {
      const result = await api(body);
      await load();
      status(
        body.action === "import"
          ? "Added to leads. Reload your business dashboard to see it."
          : "Saved.",
      );
      if (result.setup_url) showLink(result.setup_url);
    } catch (err) {
      status(err.message, true);
    } finally {
      b.disabled = false;
    }
  });
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        status("");
        paint();
      }),
  );
  $("#logout").onclick = async () => {
    try {
      const r = await fetch("/api/session", { method: "DELETE" });
      if (!r.ok) throw Error("Sign-out failed.");
      data = null;
      $("#app").remove();
      location.replace("/login/?owner=1");
    } catch (err) {
      status(err.message, true);
    }
  };
  load().catch((err) => {
    $("#loading").textContent = err.message;
    const a = document.createElement("a");
    a.href = "/login/?owner=1";
    a.textContent = " Sign in";
    $("#loading").append(a);
  });
})();
