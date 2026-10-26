// Only these explicit assets enter the release. Environment variables are never serialized.
import {
  mkdir,
  readFile,
  writeFile,
  copyFile,
  rm,
  lstat,
} from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { PUBLIC_FILES } from "../functions/_server/public-assets.mjs";
import { scanDirectory } from "./security-scan.mjs";
const root = process.cwd(),
  out = resolve(root, "dist");
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const manifest = [];
for (const path of [...PUBLIC_FILES, "_headers", "_routes.json"]) {
  const src = resolve(root, path),
    dest = resolve(out, path);
  if ((await lstat(src)).isSymbolicLink())
    throw Error("Release inputs cannot be symlinks");
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(src, dest);
  const bytes = await readFile(src);
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
