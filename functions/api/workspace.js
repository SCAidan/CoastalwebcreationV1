import {
  HttpError,
  json,
  sameOrigin,
  bodyJSON,
  authenticate,
  supa,
  failure,
} from "../_server/auth.js";
export async function onRequestGet({ request, env }) {
  try {
    const s = await authenticate(request, env);
    if (s.role !== "owner") throw new HttpError(403, "Owner access required.");
    const r = await supa(
      env,
      "/rest/v1/agency_workspaces?select=data,revision&owner_id=eq." +
        s.user.id,
      s.token,
    );
    if (!r.ok) throw new HttpError(502, "Unable to load your workspace.");
    return json(
      (await r.json())[0] || {
        data: {
          leads: [],
          calls: [],
          clients: [],
          projects: [],
          tasks: [],
          transactions: [],
        },
        revision: null,
      },
      200,
      s.cookies,
    );
  } catch (e) {
    return failure(e);
  }
}
export async function onRequestPost({ request, env }) {
  try {
    sameOrigin(request);
    const s = await authenticate(request, env);
    if (s.role !== "owner") throw new HttpError(403, "Owner access required.");
    const input = await bodyJSON(request, 1000000);
    if (
      !input.data ||
      typeof input.data !== "object" ||
      !["leads", "calls", "clients", "projects", "tasks", "transactions"].every(
        (k) => Array.isArray(input.data[k]),
      )
    )
      throw new HttpError(400, "Invalid workspace data.");
    let path = "/rest/v1/agency_workspaces",
      method = "POST",
      record = { owner_id: s.user.id, data: input.data, revision: 1 };
    if (input.revision !== null) {
      if (!Number.isSafeInteger(input.revision) || input.revision < 1)
        throw new HttpError(400, "Invalid revision.");
      path += "?owner_id=eq." + s.user.id + "&revision=eq." + input.revision;
      method = "PATCH";
      record = {
        data: input.data,
        revision: input.revision + 1,
        updated_at: new Date().toISOString(),
      };
    }
    const r = await supa(env, path, s.token, {
      method,
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(record),
    });
    if (r.status === 409)
      throw new HttpError(
        409,
        "Another device saved first. Export your changes, then reload.",
      );
    if (!r.ok)
      throw new HttpError(
        502,
        "Unable to save. Export a backup before closing.",
      );
    const rows = await r.json();
    if (!rows.length)
      throw new HttpError(
        409,
        "Another device changed this workspace. Export your changes, then reload.",
      );
    return json({ revision: rows[0].revision }, 200, s.cookies);
  } catch (e) {
    return failure(e);
  }
}
