import { publicPath, API_METHODS } from "./_server/public-assets.mjs";
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; upgrade-insecure-requests";
function finish(response, path) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Content-Security-Policy", CSP);
  headers.set("Referrer-Policy", "no-referrer");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  headers.set("Strict-Transport-Security", "max-age=31536000");
  if (response.status >= 400) headers.set("Cache-Control", "no-store");
  if (/^\/(?:api|dashboard|portal|login|thank-you)(?:\/|$)/.test(path)) {
    headers.set("Cache-Control", "no-store");
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  headers.delete("SourceMap");
  headers.delete("X-SourceMap");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
export async function onRequest(context) {
  let path;
  try {
    path = decodeURIComponent(new URL(context.request.url).pathname);
  } catch {
    return finish(new Response("Not found", { status: 404 }), "/");
  }
  const methods = API_METHODS[path];
  const api = path.startsWith("/api/");
  if (
    (api && !methods) ||
    (!api && !publicPath(path)) ||
    /[\\\u0000]/.test(path) ||
    path.includes("%")
  )
    return finish(new Response("Not found", { status: 404 }), path);
  const allowed = api ? methods : ["GET", "HEAD"];
  if (!allowed.includes(context.request.method))
    return finish(
      new Response("Method not allowed", {
        status: 405,
        headers: { Allow: allowed.join(", ") },
      }),
      path,
    );
  try {
    return finish(await context.next(), path);
  } catch {
    return finish(
      new Response("Service temporarily unavailable", { status: 503 }),
      path,
    );
  }
}
