(() => {
  const $ = (s) => document.querySelector(s),
    params = new URLSearchParams(location.hash.slice(1));
  const setup = params.get("setup"),
    token_hash = params.get("token_hash");
  if (location.hash)
    history.replaceState(null, "", location.pathname + location.search);
  let next = "/portal/";
  const status = (message, error = false) => {
    $("#status").textContent = message;
    $("#status").className = "status" + (error ? " error" : "");
  };
  async function post(data) {
    const r = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error || "Unable to sign in.");
    return d;
  }
  if (new URLSearchParams(location.search).get("owner") === "1") {
    $("#intro").textContent =
      "Sign in with your owner account to open your business dashboard.";
    $("#owner-link").hidden = true;
  }
  $("#show").onclick = () => {
    const show = $("#password").type === "password";
    $("#password").type = show ? "text" : "password";
    $("#show").textContent = show ? "Hide password" : "Show password";
    $("#show").setAttribute("aria-pressed", String(show));
  };
  $("#login-form").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.target.querySelector("[type=submit]");
    button.disabled = true;
    status("Signing in…");
    try {
      const d = await post(Object.fromEntries(new FormData(e.target)));
      e.target.reset();
      location.replace(d.next);
    } catch (err) {
      status(err.message, true);
    } finally {
      button.disabled = false;
    }
  };
  $("#password-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    if (f.get("password") !== f.get("confirmation")) {
      status("The passwords don’t match.", true);
      return;
    }
    const button = e.target.querySelector("button");
    button.disabled = true;
    try {
      const d = await post({ action: "password", password: f.get("password") });
      e.target.reset();
      location.replace(d.next || next);
    } catch (err) {
      status(err.message, true);
    } finally {
      button.disabled = false;
    }
  };
  (async () => {
    if (setup && token_hash) {
      $("#login-form").hidden = true;
      status("Checking your private setup link…");
      try {
        const d = await post({ action: "activate", type: setup, token_hash });
        next = d.next;
        $("#heading").textContent = "Make yourself at home.";
        $("#intro").textContent = "Choose a password for your account.";
        $("#password-form").hidden = false;
        status("Link verified. Set your password to continue.");
      } catch (err) {
        status(err.message, true);
        $("#login-form").hidden = false;
      }
    } else {
      try {
        const r = await fetch("/api/session");
        if (r.ok) {
          const d = await r.json();
          location.replace(d.next);
        }
      } catch {
        status("Connection unavailable. Please try signing in.", true);
      }
    }
  })();
})();
