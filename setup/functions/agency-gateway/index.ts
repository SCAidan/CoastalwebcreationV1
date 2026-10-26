// Privileged keys stay in the Supabase Edge runtime. No outgoing emails are sent.
const OWNER = "bf6331f2-e5b7-4070-a301-443b0183c41b";
export async function handle(request: Request, env: Record<string, string>) {
  const origin = request.headers.get("Origin") || "";
  const allowed =
    /^https:\/\/(?:[a-z0-9-]+\.)?coastalwebcreationv1\.pages\.dev$/.test(
      origin,
    ) ||
    (env.SITE_ORIGIN && origin === env.SITE_ORIGIN);
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        ...(allowed
          ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
          : {}),
      },
    });
  if (request.method === "OPTIONS")
    return new Response(null, {
      status: allowed ? 204 : 403,
      headers: allowed
        ? {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers":
              "authorization,apikey,content-type,x-client-ip",
          }
        : {},
    });
  if (!allowed || request.method !== "POST")
    return reply({ error: "Request not allowed." }, 403);
  const base = env.SUPABASE_URL,
    key = env.SUPABASE_SERVICE_ROLE_KEY;
  const call = (path: string, options: RequestInit = {}) =>
    fetch(base + path, {
      ...options,
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(15000),
    });
  try {
    const reader = request.body?.getReader();
    let size = 0,
      raw = "";
    const decoder = new TextDecoder();
    if (!reader) return reply({ error: "Request body required." }, 400);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 12000) {
        await reader.cancel();
        return reply({ error: "Request too large." }, 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    let i;
    try {
      i = JSON.parse(raw);
    } catch {
      return reply({ error: "Invalid request." }, 400);
    }
    const str = (v: unknown, min: number, max: number) => {
      if (
        typeof v !== "string" ||
        v.trim().length < min ||
        v.trim().length > max
      )
        throw Error("validation");
      return v.trim();
    };
    const email = (v: unknown) => {
      const s = str(v, 3, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw Error("validation");
      return s;
    };
    if (i.action === "inquiry") {
      if (i.website)
        return reply({ error: "Unable to submit this form." }, 400);
      const row = {
        name: str(i.name, 1, 120),
        email: email(i.email),
        business: str(i.business || "", 0, 160),
        service: i.service || "unsure",
        style: i.style || "unsure",
        message: str(i.message, 1, 3000),
      };
      if (
        !["unsure", "new", "refresh", "care"].includes(row.service) ||
        !["unsure", "restaurant", "professional"].includes(row.style)
      )
        throw Error("validation");
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(
          (request.headers.get("x-client-ip") || "unknown") + key,
        ),
      );
      const fingerprint = Array.from(new Uint8Array(digest), (x) =>
        x.toString(16).padStart(2, "0"),
      ).join("");
      const limit = await call("/rest/v1/rpc/claim_inquiry_slot", {
        method: "POST",
        body: JSON.stringify({ fingerprint }),
      });
      if (!limit.ok)
        return reply(
          {
            error:
              "Inquiry service temporarily unavailable. Call or email Aidan.",
          },
          503,
        );
      if ((await limit.json()) !== true)
        return reply(
          {
            error:
              "Too many submissions. Please try later or contact Aidan directly.",
          },
          429,
        );
      const saved = await call("/rest/v1/website_inquiries?select=id", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(row),
      });
      if (!saved.ok)
        return reply(
          { error: "Your inquiry could not be saved. Please try again." },
          502,
        );
      const rows = await saved.json();
      return reply({ receipt: rows[0].id }, 201);
    }
    // All account provisioning requires a currently verified owner session.
    const authorization = request.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer "))
      return reply({ error: "Sign in first." }, 401);
    const verified = await call("/auth/v1/user", {
      headers: { Authorization: authorization },
    });
    if (!verified.ok) return reply({ error: "Sign in again." }, 401);
    const user = await verified.json();
    if (user.id !== OWNER)
      return reply({ error: "Owner access required." }, 403);
    let address, business_name, type;
    if (i.action === "provision") {
      address = email(i.email);
      business_name = str(i.business_name, 1, 160);
      type = "invite";
    } else if (i.action === "setup_link") {
      if (
        typeof i.client_id !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(i.client_id)
      )
        throw Error("validation");
      const r = await call(
        "/rest/v1/client_accounts?select=id,email&active=eq.true&id=eq." +
          encodeURIComponent(i.client_id),
      );
      if (!r.ok) return reply({ error: "Unable to find this client." }, 502);
      const rows = await r.json();
      if (!rows.length)
        return reply({ error: "Active client account required." }, 400);
      address = rows[0].email;
      type = "recovery";
    } else return reply({ error: "Unknown action." }, 400);
    const link = await call("/auth/v1/admin/generate_link", {
      method: "POST",
      body: JSON.stringify({ type, email: address }),
    });
    if (!link.ok)
      return reply(
        {
          error:
            "Could not generate access. If this email already has an account, use its existing setup-link button.",
        },
        400,
      );
    const data = await link.json(),
      id = data.user?.id || data.id,
      hash = data.properties?.hashed_token || data.hashed_token;
    if (
      !id ||
      !hash ||
      id === OWNER ||
      (type === "recovery" && id !== i.client_id)
    )
      return reply(
        { error: "Unable to create client access for this account." },
        400,
      );
    if (type === "invite") {
      const saved = await call("/rest/v1/client_accounts", {
        method: "POST",
        body: JSON.stringify({ id, email: address, business_name }),
      });
      if (!saved.ok)
        return reply(
          {
            error:
              "Account created but portal access was not saved. Contact support before retrying.",
          },
          502,
        );
    }
    return reply({
      setup_url:
        origin +
        "/login/#setup=" +
        type +
        "&token_hash=" +
        encodeURIComponent(hash),
    });
  } catch (e) {
    return reply(
      {
        error:
          e instanceof Error && e.message === "validation"
            ? "Please check the form fields."
            : "Connection failed. Please try again.",
      },
      e instanceof Error && e.message === "validation" ? 400 : 502,
    );
  }
}
Deno.serve((request: Request) =>
  handle(request, {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    SITE_ORIGIN: Deno.env.get("SITE_ORIGIN") || "",
  }),
);
