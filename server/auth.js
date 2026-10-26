// Server-only session helpers. Never return access/refresh tokens to browser JavaScript.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const json = (data, status = 200, cookies = []) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(JSON.stringify(data), { status, headers });
};
export function sameOrigin(request) {
  if (request.headers.get("Origin") !== new URL(request.url).origin)
    throw new HttpError(403, "Request origin not allowed.");
}
export async function bodyJSON(request, max = 12000) {
  if (Number(request.headers.get("Content-Length")) > max)
    throw new HttpError(413, "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body required.");
  let length = 0,
    chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > max) {
      await reader.cancel();
      throw new HttpError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "Invalid request.");
  }
}
export const text = (value, min, max, label) => {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new HttpError(400, "Check " + label + ".");
  return value.trim();
};
export const uuid = (value) => {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new HttpError(400, "Invalid record ID.");
  return value;
};
// Existing project identifiers are public (also present in the site config and RLS policies).
// This enables Cloudflare branch previews without copying private production secrets.
const publicProject = {
  SUPABASE_URL: "https://aoadwygtjzctjhdovbds.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_7H7a0-s2p9xhI0D0DT84Iw_PSXA0Ybp",
  OWNER_USER_ID: "bf6331f2-e5b7-4070-a301-443b0183c41b",
};
export function config(env) {
  if (!env.SUPABASE_URL && !env.SUPABASE_PUBLISHABLE_KEY && !env.OWNER_USER_ID)
    return { ...env, ...publicProject };
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY || !env.OWNER_USER_ID)
    throw new HttpError(503, "Account services are not configured.");
  return env;
}
export async function supa(env, path, token, options = {}) {
  env = config(env);
  return fetch(env.SUPABASE_URL + path, {
    ...options,
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });
}
export const cookieValue = (request, name) => {
  const part = (request.headers.get("Cookie") || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(name + "="));
  return part ? part.slice(name.length + 1) : "";
};
const cookie = (name, value, seconds) =>
  `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
export const clearCookies = () => [
  cookie("__Host-coastal-access", "", 0),
  cookie("__Host-coastal-refresh", "", 0),
];
export function sessionCookies(data) {
  return [
    cookie(
      "__Host-coastal-access",
      data.access_token,
      Math.min(Number(data.expires_in) || 3600, 3600),
    ),
    cookie("__Host-coastal-refresh", data.refresh_token, 28800),
  ];
}
export async function roleFor(env, user, token) {
  env = config(env);
  if (user.id === env.OWNER_USER_ID) return "owner";
  const response = await supa(
    env,
    "/rest/v1/client_accounts?select=id&active=eq.true&id=eq." +
      encodeURIComponent(user.id),
    token,
  );
  if (!response.ok) throw new HttpError(503, "Unable to check account access.");
  const rows = await response.json();
  if (!rows.length)
    throw new HttpError(
      403,
      "This account does not have portal access. Contact Aidan.",
    );
  return "client";
}
export async function authenticate(request, env, authorize = true) {
  env = config(env);
  let token = cookieValue(request, "__Host-coastal-access"),
    cookies = [];
  let response = token ? await supa(env, "/auth/v1/user", token) : null;
  if (!response?.ok) {
    const refresh = cookieValue(request, "__Host-coastal-refresh");
    if (!refresh) throw new HttpError(401, "Please sign in.");
    const renewed = await supa(
      env,
      "/auth/v1/token?grant_type=refresh_token",
      env.SUPABASE_PUBLISHABLE_KEY,
      { method: "POST", body: JSON.stringify({ refresh_token: refresh }) },
    );
    if (!renewed.ok)
      throw new HttpError(401, "Your session ended. Please sign in again.");
    const data = await renewed.json();
    token = data.access_token;
    cookies = sessionCookies(data);
    response = await supa(env, "/auth/v1/user", token);
  }
  if (!response.ok) throw new HttpError(401, "Please sign in again.");
  const user = await response.json();
  const role = authorize ? await roleFor(env, user, token) : null;
  return { token, user, role, cookies };
}
export const destination = (role) =>
  role === "owner" ? "/dashboard/" : "/portal/";
export const failure = (error) =>
  json(
    {
      error:
        error instanceof HttpError
          ? error.message
          : "The connection failed. Please try again.",
    },
    error instanceof HttpError ? error.status : 502,
    error?.status === 401 ? clearCookies() : [],
  );

export function password(value, min = 1) {
  if (typeof value !== "string" || value.length < min || value.length > 128)
    throw new HttpError(
      400,
      "Check your password" +
        (min > 1 ? " (at least " + min + " characters)" : "") +
        ".",
    );
  return value;
}
