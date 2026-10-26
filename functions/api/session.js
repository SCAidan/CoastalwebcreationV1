import {
  HttpError,
  json,
  sameOrigin,
  bodyJSON,
  text,
  password as checkedPassword,
  config,
  supa,
  authenticate,
  roleFor,
  sessionCookies,
  clearCookies,
  destination,
  failure,
} from "../../server/auth.js";
export async function onRequestGet({ request, env }) {
  try {
    const session = await authenticate(request, env);
    return json(
      { role: session.role, next: destination(session.role) },
      200,
      session.cookies,
    );
  } catch (error) {
    return failure(error);
  }
}
export async function onRequestPost({ request, env }) {
  try {
    sameOrigin(request);
    env = config(env);
    const input = await bodyJSON(request, 4000);
    if (input.action === "password") {
      const session = await authenticate(request, env);
      const password = checkedPassword(input.password, 12);
      const response = await supa(env, "/auth/v1/user", session.token, {
        method: "PUT",
        body: JSON.stringify({ password }),
      });
      if (!response.ok)
        throw new HttpError(
          400,
          "Password could not be updated. Try a different password or request a new setup link.",
        );
      return json({ next: destination(session.role) }, 200, session.cookies);
    }
    let response;
    if (input.action === "activate") {
      if (!["invite", "recovery"].includes(input.type))
        throw new HttpError(400, "Invalid setup link.");
      const token_hash = text(input.token_hash, 20, 200, "the setup link");
      response = await supa(
        env,
        "/auth/v1/verify",
        env.SUPABASE_PUBLISHABLE_KEY,
        {
          method: "POST",
          body: JSON.stringify({ token_hash, type: input.type }),
        },
      );
    } else {
      const email = text(input.email, 3, 254, "your email address"),
        password = checkedPassword(input.password);
      response = await supa(
        env,
        "/auth/v1/token?grant_type=password",
        env.SUPABASE_PUBLISHABLE_KEY,
        { method: "POST", body: JSON.stringify({ email, password }) },
      );
    }
    if (!response.ok)
      throw new HttpError(
        401,
        input.action === "activate"
          ? "This setup link is invalid or expired. Ask Aidan for a new link."
          : "Unable to sign in. Check your email and password.",
      );
    const data = await response.json();
    const verified = await supa(env, "/auth/v1/user", data.access_token);
    if (!verified.ok)
      throw new HttpError(401, "Unable to verify this session.");
    const role = await roleFor(env, await verified.json(), data.access_token);
    return json(
      {
        role,
        next: destination(role),
        requiresPassword: input.action === "activate",
      },
      200,
      sessionCookies(data),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function onRequestDelete({ request, env }) {
  try {
    sameOrigin(request);
    const session = await authenticate(request, env, false);
    const response = await supa(
      env,
      "/auth/v1/logout?scope=local",
      session.token,
      { method: "POST" },
    );
    if (!response.ok)
      throw new HttpError(502, "Unable to revoke the session. Try again.");
    return json({ ok: true }, 200, clearCookies());
  } catch (error) {
    if (error.status === 401) return json({ ok: true }, 200, clearCookies());
    return failure(error);
  }
}
