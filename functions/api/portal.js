import {
  HttpError,
  json,
  sameOrigin,
  bodyJSON,
  text,
  uuid,
  supa,
  authenticate,
  failure,
} from "../_server/auth.js";
const projectStates = [
  "Discovery",
  "Design",
  "Review",
  "Ready to launch",
  "Launched",
  "On hold",
];
const requestStates = ["New", "In progress", "Waiting for you", "Completed"];
function choice(value, values) {
  if (!values.includes(value))
    throw new HttpError(400, "Choose a valid status.");
  return value;
}
async function db(env, session, path, options = {}) {
  const r = await supa(env, "/rest/v1/" + path, session.token, {
    ...options,
    headers: { Prefer: "return=representation", ...(options.headers || {}) },
  });
  if (!r.ok)
    throw new HttpError(
      r.status === 403 ? 403 : 502,
      "This change could not be saved. Check access and try again.",
    );
  return r.status === 204 ? null : r.json();
}
export async function onRequestGet({ request, env }) {
  try {
    const s = await authenticate(request, env);
    const [accounts, projects, requests, inquiries] = await Promise.all([
      db(
        env,
        s,
        "client_accounts?select=id,business_name,email,active&order=created_at.desc&limit=200",
      ),
      db(
        env,
        s,
        "portal_projects?select=id,client_id,name,status,next_step,due_date,website_url,created_at,updated_at&order=created_at.desc&limit=200",
      ),
      db(
        env,
        s,
        "portal_requests?select=id,project_id,title,body,status,owner_reply,created_at,updated_at&order=created_at.desc&limit=200",
      ),
      s.role === "owner"
        ? db(
            env,
            s,
            "website_inquiries?select=id,name,email,business,service,style,message,status,linked_lead,created_at&order=created_at.desc&limit=200",
          )
        : [],
    ]);
    return json(
      { role: s.role, accounts, projects, requests, inquiries },
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
    const s = await authenticate(request, env),
      i = await bodyJSON(request);
    let result;
    if (i.action === "request" && s.role === "client") {
      result = await db(env, s, "portal_requests", {
        method: "POST",
        body: JSON.stringify({
          project_id: uuid(i.project_id),
          title: text(i.title, 1, 160, "a title"),
          body: text(i.body, 1, 4000, "your request"),
        }),
      });
    } else {
      if (s.role !== "owner")
        throw new HttpError(403, "Owner access required.");
      if (["provision", "setup_link"].includes(i.action)) {
        const r = await supa(env, "/functions/v1/agency-gateway", s.token, {
          method: "POST",
          headers: { Origin: new URL(request.url).origin },
          body: JSON.stringify({
            action: i.action,
            email: i.email,
            business_name: i.business_name,
            client_id: i.client_id,
          }),
        });
        const d = await r.json();
        if (!r.ok)
          throw new HttpError(r.status, d.error || "Could not create access.");
        result = d;
      } else if (i.action === "project") {
        const website_url = text(
          i.website_url || "",
          0,
          500,
          "the website address",
        );
        if (website_url) {
          let u;
          try {
            u = new URL(website_url);
          } catch {
            throw new HttpError(400, "Use a complete HTTPS website address.");
          }
          if (u.protocol !== "https:" || u.username || u.password)
            throw new HttpError(400, "Use an HTTPS website address.");
        }
        const due_date = i.due_date || null;
        if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date))
          throw new HttpError(400, "Check the date.");
        const row = {
          client_id: uuid(i.client_id),
          name: text(i.name, 1, 160, "the project name"),
          status: choice(i.status, projectStates),
          next_step: text(i.next_step || "", 0, 2000, "the next step"),
          website_url,
          due_date,
          updated_at: new Date().toISOString(),
        };
        result = await db(
          env,
          s,
          "portal_projects" + (i.id ? "?id=eq." + uuid(i.id) : ""),
          { method: i.id ? "PATCH" : "POST", body: JSON.stringify(row) },
        );
      } else if (i.action === "reply")
        result = await db(env, s, "portal_requests?id=eq." + uuid(i.id), {
          method: "PATCH",
          body: JSON.stringify({
            status: choice(i.status, requestStates),
            owner_reply: text(i.owner_reply || "", 0, 4000, "your reply"),
            updated_at: new Date().toISOString(),
          }),
        });
      else if (i.action === "account")
        result = await db(env, s, "client_accounts?id=eq." + uuid(i.id), {
          method: "PATCH",
          body: JSON.stringify({ active: i.active === true }),
        });
      else if (i.action === "import")
        result = await db(env, s, "rpc/import_website_inquiry", {
          method: "POST",
          body: JSON.stringify({ inquiry_id: uuid(i.id) }),
        });
      else if (i.action === "inquiry")
        result = await db(env, s, "website_inquiries?id=eq." + uuid(i.id), {
          method: "PATCH",
          body: JSON.stringify({
            status: choice(i.status, ["New", "Contacted", "Archived"]),
          }),
        });
      else throw new HttpError(400, "Unknown action.");
    }
    return json(
      {
        ok: true,
        ...(result?.setup_url ? { setup_url: result.setup_url } : {}),
      },
      200,
      s.cookies,
    );
  } catch (e) {
    return failure(e);
  }
}
