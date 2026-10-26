import {
  HttpError,
  json,
  sameOrigin,
  bodyJSON,
  config,
  supa,
  failure,
} from "../../server/auth.js";
export async function onRequestPost({ request, env }) {
  try {
    sameOrigin(request);
    env = config(env);
    const input = await bodyJSON(request, 12000);
    const response = await supa(
      env,
      "/functions/v1/agency-gateway",
      env.SUPABASE_PUBLISHABLE_KEY,
      {
        method: "POST",
        headers: {
          Origin: new URL(request.url).origin,
          "x-client-ip": request.headers.get("CF-Connecting-IP") || "unknown",
        },
        body: JSON.stringify({ ...input, action: "inquiry" }),
      },
    );
    const data = await response.json();
    if (!response.ok)
      throw new HttpError(
        response.status,
        data.error || "Unable to save your inquiry. Please try again.",
      );
    return json({ accepted: true, receipt: data.receipt }, 201);
  } catch (e) {
    return failure(e);
  }
}
