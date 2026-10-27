import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectSecrets, scanDirectory } from "../scripts/security-scan.mjs";
import {
  PUBLIC_FILES,
  publicPath,
} from "../functions/_server/public-assets.mjs";
const moduleURL = (s) =>
  "data:text/javascript;base64," + Buffer.from(s).toString("base64");
const assets = moduleURL(
  await readFile(
    new URL("../functions/_server/public-assets.mjs", import.meta.url),
    "utf8",
  ),
);
const source = (
  await readFile(
    new URL("../functions/_middleware.js", import.meta.url),
    "utf8",
  )
).replace("./_server/public-assets.mjs", assets);
const { onRequest } = await import(moduleURL(source));
function context(path, method = "GET", response) {
  let called = false;
  return {
    request: new Request("https://site.test" + path, { method }),
    next: async () => {
      called = true;
      return response || new Response("public content");
    },
    wasCalled: () => called,
  };
}
test("explicit publication boundary", async (t) => {
  for (const path of [
    "/functions/_server/auth.js",
    "/server/auth.js",
    "/server/public-assets.mjs",
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
    "/assets/site.css.map",
    "/assets/site.js.bak",
    "/audits/security.md",
    "/docs/qa/homepage-desktop.jpg",
    "/assets/%2e%2e/server/auth.js",
    "/%252eenv",
    "/api/unknown",
  ])
    await t.test("denies " + path, async () => {
      const c = context(path),
        r = await onRequest(c);
      assert.equal(r.status, 404);
      assert.equal(c.wasCalled(), false);
      assert.equal(await r.text(), "Not found");
      assert.equal(r.headers.get("Cache-Control"), "no-store");
    });
  await t.test("all published files can pass the boundary", async () => {
    for (const file of PUBLIC_FILES) {
      const c = context("/" + file),
        r = await onRequest(c);
      assert.equal(r.status, 200, file);
      assert.equal(c.wasCalled(), true, file);
    }
  });
  await t.test("public pages only permit safe read methods", async () => {
    const c = context("/", "POST"),
      r = await onRequest(c);
    assert.equal(r.status, 405);
    assert.equal(c.wasCalled(), false);
  });
  await t.test("unsupported API verbs are denied before handler", async () => {
    const c = context("/api/workspace", "DELETE"),
      r = await onRequest(c);
    assert.equal(r.status, 405);
    assert.equal(c.wasCalled(), false);
  });
  await t.test(
    "API headers do not expose source maps and retain cookies",
    async () => {
      const h = new Headers({ SourceMap: "/private.map" });
      h.append("Set-Cookie", "__Host-one=one; Path=/; Secure; HttpOnly");
      h.append("Set-Cookie", "__Host-two=two; Path=/; Secure; HttpOnly");
      const c = context(
        "/api/session",
        "GET",
        new Response("{}", { headers: h }),
      );
      const r = await onRequest(c);
      assert.equal(r.headers.get("SourceMap"), null);
      assert.equal(r.headers.getSetCookie().length, 2);
      assert.equal(r.headers.get("Cache-Control"), "no-store");
      assert.ok(
        r.headers.get("Content-Security-Policy").includes("script-src 'self'"),
      );
      assert.ok(
        !r.headers
          .get("Content-Security-Policy")
          .includes("script-src 'self' 'unsafe-inline'"),
      );
      assert.equal(r.headers.get("X-Frame-Options"), "DENY");
    },
  );
  await t.test(
    "unexpected runtime failures do not disclose stack or env",
    async () => {
      const c = context("/api/session");
      c.next = async () => {
        throw Error("private fixture stack");
      };
      const r = await onRequest(c);
      assert.equal(r.status, 503);
      assert.ok(!(await r.text()).includes("private fixture"));
    },
  );
});
test("release scanning rejects credentials and source maps", async () => {
  const key = ["sk", "live", "A".repeat(32)].join("_");
  assert.ok(detectSecrets(key).includes("provider-secret"));
  assert.ok(
    detectSecrets("postgres" + "ql://owner:password@db.test/db").includes(
      "database-credentials",
    ),
  );
  assert.ok(
    detectSecrets(["-----BEGIN", "PRIVATE KEY-----"].join(" ")).includes(
      "private-key",
    ),
  );
  assert.ok(
    detectSecrets("sb_" + "publishable_" + "publicValue", {
      client: true,
    }).includes("publishable-key-in-client"),
  );
  assert.ok(
    detectSecrets("// sourceMapping" + "URL=private.map", {
      client: true,
    }).includes("inline-source-map"),
  );
  assert.ok(
    detectSecrets('"sources' + 'Content":["private"]', {
      client: true,
    }).includes("inline-source-map"),
  );
  const root = await mkdtemp(join(tmpdir(), "coastal-release-"));
  try {
    await mkdir(join(root, "assets"));
    await writeFile(join(root, "assets", "bad.js"), key);
    await writeFile(join(root, "assets", "bad.js.map"), "{}");
    const scan = await scanDirectory(root);
    assert.equal(scan.findings.length, 2);
    assert.ok(!JSON.stringify(scan).includes(key));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("browser files contain no privileged configuration or source maps", async () => {
  for (const file of PUBLIC_FILES) {
    if (!/\.(js|html|css|txt|xml)$/.test(file)) continue;
    const value = await readFile(
      new URL("../" + file, import.meta.url),
      "utf8",
    );
    assert.deepEqual(detectSecrets(value, { client: true }), [], file);
  }
});
test("PayPal URL matches decoded user QR and does not claim automatic payment", async () => {
  const html = await readFile(
    new URL("../pay/index.html", import.meta.url),
    "utf8",
  );
  const links = [...html.matchAll(/href="(https:[^"]+)"/g)].map(
    (x) => new URL(x[1]),
  );
  assert.equal(links.length, 1);
  assert.equal(links[0].hostname, "www.paypal.com");
  assert.equal(links[0].pathname, "/qrcodes/p2pqrc/8Z3AXXRH6N6QQ");
  assert.ok(html.includes("Goods &amp; Services"));
  assert.ok(html.includes("confirmed manually"));
  assert.ok(!html.includes("<script"));
});

test("build does not serialize runtime environment values", async () => {
  const { execFileSync } = await import("node:child_process");
  const canary = "coastal-build-canary-" + crypto.randomUUID();
  execFileSync(process.execPath, ["scripts/build.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      OPENAI_API_KEY: canary,
      SUPABASE_SERVICE_ROLE_KEY: canary,
      DATABASE_URL: canary,
    },
    stdio: "pipe",
  });
  for (const file of PUBLIC_FILES) {
    const value = await readFile(new URL("../dist/" + file, import.meta.url));
    assert.ok(!value.includes(Buffer.from(canary)), file);
  }
});
