(() => {
  const $ = (s) => document.querySelector(s);
  let connected = false,
    revision = null,
    chain = Promise.resolve(),
    blocked = false;
  const status = (t) => ($("#sync-state").textContent = t);
  async function api(path, options = {}) {
    const r = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const d = await r.json();
    if (r.status === 401) {
      connected = false;
      location.replace("/login/?owner=1");
    }
    if (!r.ok) throw Error(d.error || "Cloud request failed.");
    return d;
  }
  window.CoastalCloud = {
    connected: () => connected,
    queueSave(data) {
      chain = chain.then(async () => {
        if (blocked || !connected) return false;
        status("Saving…");
        try {
          const d = await api("/api/workspace", {
            method: "POST",
            body: JSON.stringify({ data, revision }),
          });
          revision = d.revision;
          status("Cloud connected · saved");
          return true;
        } catch (e) {
          blocked = true;
          status("Not saved · export backup");
          $("#storage-notice").textContent =
            e.message +
            " Further writes are paused. Export a backup before reloading.";
          return false;
        }
      });
      return chain;
    },
  };
  $("#auth-open").onclick = async () => {
    await chain;
    if (
      blocked &&
      !confirm(
        "Some changes are not saved. Export a backup before signing out. Sign out anyway?",
      )
    )
      return;
    try {
      await api("/api/session", { method: "DELETE" });
      connected = false;
      window.coastalReplace({
        leads: [],
        calls: [],
        clients: [],
        projects: [],
        tasks: [],
        transactions: [],
      });
      location.replace("/login/?owner=1");
    } catch (e) {
      $("#storage-notice").textContent = e.message;
    }
  };
  async function start() {
    try {
      const s = await api("/api/session");
      if (s.role !== "owner") {
        location.replace("/portal/");
        return;
      }
      const d = await api("/api/workspace");
      revision = d.revision;
      connected = true;
      window.coastalReplace(d.data);
      $("#auth-open").textContent = "Sign out";
      status("Cloud connected · saved");
      $("#storage-notice").textContent =
        "Owner workspace · Changes save to your account. Customer accounts cannot access these records.";
      document.body.classList.remove("private-hidden");
    } catch (e) {
      $("#storage-notice").textContent = e.message;
      document.body.classList.remove("private-hidden");
      $("#view").textContent =
        "Unable to load your workspace. Reload to try again.";
      $("#add").disabled = true;
    }
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
