// Only these explicit assets enter the release. Environment variables are never serialized.
import {
  mkdir,
  readFile,
  writeFile,
  rm,
  lstat,
} from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { PUBLIC_FILES } from "../functions/_server/public-assets.mjs";
import { scanDirectory } from "./security-scan.mjs";
import { versionAssets } from "./asset-versions.mjs";
const root = process.cwd(),
  out = resolve(root, "dist");
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const manifest = [];
const inputs = [...PUBLIC_FILES, "_headers", "_routes.json"];
const releaseHash = createHash("sha256");
const contents = new Map();
for (const path of inputs) {
  const src = resolve(root, path);
  if ((await lstat(src)).isSymbolicLink())
    throw Error("Release inputs cannot be symlinks");
  const bytes = await readFile(src);
  contents.set(path, bytes);
  releaseHash.update(path).update("\0").update(bytes).update("\0");
}
const version = releaseHash.digest("hex").slice(0, 16);
for (const path of inputs) {
  const dest = resolve(out, path);
  await mkdir(dirname(dest), { recursive: true });
  const original = contents.get(path);
  const bytes = /\.(?:html|css)$/.test(path)
    ? Buffer.from(versionAssets(original.toString("utf8"), path, PUBLIC_FILES, version))
    : original;
  await writeFile(dest, bytes);
  manifest.push({
    path,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
const scan = await scanDirectory(out);
if (scan.findings.length) {
  console.error(
    JSON.stringify({ error: "Release rejected", findings: scan.findings }),
  );
  await rm(out, { recursive: true, force: true });
  process.exit(1);
}
await mkdir(".artifacts", { recursive: true });
await writeFile(
  ".artifacts/public-manifest.json",
  JSON.stringify({ files: manifest, scan }, null, 2),
);
console.log(
  "Verified " +
    manifest.length +
    " public files. No secret patterns or source maps detected.",
);
