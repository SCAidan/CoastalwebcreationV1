// Read-only HTTP audit. Never signs in, fetches private rows or calls a payment provider.
import { PUBLIC_FILES } from "../functions/_server/public-assets.mjs";
import { detectSecrets } from "./security-scan.mjs";
import { mkdir, writeFile } from "node:fs/promises";
const origin = new URL(
  process.argv[2] || "https://coastalwebcreationv1.pages.dev",
).origin;
const results = [],
  failures = [];
async function inspect(path, { blocked = false, ...init } = {}) {
  try {
    const r = await fetch(origin + path, {
        ...init,
        signal: AbortSignal.timeout(20000),
      }),
      body = await r.text(),
      entry = {
        path,
        status: r.status,
        contentType: r.headers.get("Content-Type"),
        bytes: body.length,
        cache: r.headers.get("Cache-Control"),
        hasCSP: !!r.headers.get("Content-Security-Policy"),
      };
    results.push(entry);
    if (blocked) {
      if (r.status !== 404)
        failures.push({ path, reason: "nonpublic path not denied" });
    } else if (path.startsWith("/api/")) {
      if (![400, 401, 403, 405, 503].includes(r.status))
        failures.push({ path, reason: "unexpected anonymous API status" });
    } else {
      if (r.status !== 200)
        failures.push({ path, reason: "public asset unavailable" });
      const rules = detectSecrets(body, { client: true });
      if (rules.length) failures.push({ path, rules });
    }
    if (!entry.hasCSP) failures.push({ path, reason: "missing CSP" });
    if (r.headers.get("SourceMap") || r.headers.get("X-SourceMap"))
      failures.push({ path, reason: "source map header exposed" });
    if (
      /^\/(api|login|portal|dashboard)(\/|$)/.test(path) &&
      entry.cache !== "no-store"
    )
      failures.push({ path, reason: "private response cacheable" });
  } catch (e) {
    failures.push({ path, reason: e.name });
  }
}
for (let i = 0; i < PUBLIC_FILES.length; i += 4)
  await Promise.all(PUBLIC_FILES.slice(i, i + 4).map((p) => inspect("/" + p)));
for (const path of [
  "/server/auth.js",
  "/functions/_server/auth.js",
  "/setup/schema.sql",
  "/setup/functions/agency-gateway/index.ts",
  "/tests/portal.test.mjs",
  "/scripts/portal-demo.mjs",
  "/package.json",
  "/package-lock.json",
  "/.env",
  "/.env.production",
  "/.git/config",
  "/.dev.vars",
  "/assets/site.js.map",
  "/dashboard/cloud.js.map",
  "/api/unknown",
])
  await inspect(path, { blocked: true });
for (const path of ["/api/session", "/api/workspace", "/api/portal"])
  await inspect(path);
await inspect("/api/session", {
  method: "POST",
  headers: {
    Origin: "https://untrusted.invalid",
    "Content-Type": "application/json",
  },
  body: "{}",
});
await mkdir(".artifacts", { recursive: true });
await writeFile(
  ".artifacts/deployment-audit.json",
  JSON.stringify({ origin, results, failures }, null, 2),
);
console.log(
  JSON.stringify({ origin, requests: results.length, failures }, null, 2),
);
if (failures.length) process.exitCode = 1;
