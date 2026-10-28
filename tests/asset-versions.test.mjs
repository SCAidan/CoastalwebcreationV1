import test from "node:test";
import assert from "node:assert/strict";
import { versionAssets } from "../scripts/asset-versions.mjs";

const files = ["assets/site.css", "assets/photo.webp", "templates/menu.js"];
test("a release versions same-origin assets while preserving navigation and form destinations", () => {
  const html = '<link href="../assets/site.css"><img src="/assets/photo.webp#detail"><script src="menu.js?mode=demo"></script><a href="/?style=restaurant#contact">Choose</a><form action="/api/inquiries"></form><a href="https://other.test/assets/photo.webp">External</a>';
  const out = versionAssets(html, "templates/restaurant.html", files, "abc123");
  assert.ok(out.includes('href="../assets/site.css?v=abc123"'));
  assert.ok(out.includes('src="/assets/photo.webp?v=abc123#detail"'));
  assert.ok(out.includes('src="menu.js?mode=demo&v=abc123"'));
  assert.ok(out.includes('href="/?style=restaurant#contact"'));
  assert.ok(out.includes('action="/api/inquiries"'));
  assert.ok(out.includes('href="https://other.test/assets/photo.webp"'));
  assert.notEqual(out, versionAssets(html, "templates/restaurant.html", files, "def456"));
});
test("CSS images use the same release; unpublished paths, data URLs and JavaScript stay untouched", () => {
  const css = '.hero{background:url("../assets/photo.webp")} .icon{background:url(data:image/svg+xml;base64,AAAA)}';
  assert.ok(versionAssets(css, "templates/menu.css", files, "abc123").includes('url("../assets/photo.webp?v=abc123")'));
  assert.ok(versionAssets(css, "templates/menu.css", files, "abc123").includes('url(data:image/svg+xml;base64,AAAA)'));
  assert.equal(versionAssets('<img src="/private/photo.webp">', "index.html", files, "abc123"), '<img src="/private/photo.webp">');
  const js = 'fetch("/api/inquiries")';
  assert.equal(versionAssets(js, "assets/site.js", files, "abc123"), js);
});
