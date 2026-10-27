// Secret checks never print matched values. Release scans are stricter than source scans.
import { readFile, readdir, lstat } from "node:fs/promises";
import { resolve, relative, extname, join } from "node:path";
import { createHash } from "node:crypto";
import { PUBLIC_FILES } from "../functions/_server/public-assets.mjs";
import { fileURLToPath } from "node:url";
export function detectSecrets(value, { client = false } = {}) {
  const rules = [
    [
      "private-key",
      /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
    ],
    [
      "provider-secret",
      /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{12,}|\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}|\bsb_secret_[A-Za-z0-9_-]{12,}|\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}|\bAKIA[A-Z0-9]{16}/,
    ],
    [
      "database-credentials",
      /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s/@:]+:[^\s/@]+@/i,
    ],
    [
      "jwt-literal",
      /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/,
    ],
    [
      "credential-assignment",
      /\b(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|PAYPAL_CLIENT_SECRET|DATABASE_URL|CLOUDFLARE_API_TOKEN|ACCESS_TOKEN|REFRESH_TOKEN)\s*[:=]\s*["'][A-Za-z0-9+/_=.:-]{20,}["']/i,
    ],
  ];
  if (client)
    rules.push(
      ["publishable-key-in-client", /\bsb_publishable_[A-Za-z0-9_-]+/],
      [
        "sensitive-env-in-client",
        /\b(?:process\.env|import\.meta\.env|Deno\.env|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|DATABASE_URL|PAYPAL_CLIENT_SECRET)\b/,
      ],
      [
        "inline-source-map",
        /sourceMappingURL\s*=|sourceURL\s*=|"sourcesContent"\s*:/,
      ],
    );
  return rules
    .filter(([, pattern]) => pattern.test(value))
    .map(([name]) => name);
}
export async function scanDirectory(root, { client = true } = {}) {
  const files = [],
    findings = [],
    allowed = new Set([...PUBLIC_FILES, "_headers", "_routes.json"]);
  async function walk(dir) {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, ent.name);
      if (ent.isSymbolicLink()) throw Error("Symlinks are not publishable");
      if (ent.isDirectory()) await walk(path);
      else files.push(path);
    }
  }
  await walk(root);
  for (const file of files) {
    const path = relative(root, file).split("\\").join("/"),
      bytes = await readFile(file),
      rules = [];
    if (client && !allowed.has(path)) rules.push("unexpected-public-file");
    if (
      /(?:^|\/)(?:\.env[^/]*|\.dev\.vars[^/]*|\.git|node_modules|server|functions|setup|tests|audits|docs|scripts)(?:\/|$)|\.(?:map|pem|key|p12|pfx|sql|ts|mjs|cjs|log|bak|zip|sqlite|db)$/i.test(
        path,
      )
    )
      rules.push("nonpublic-file");
    rules.push(...detectSecrets(bytes.toString("utf8"), { client }));
    if (rules.length) findings.push({ path, rules });
  }
  return { files: files.length, findings };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = resolve(process.argv[2] || "dist");
  const result = await scanDirectory(root);
  console.log(JSON.stringify({ scope: "public-release", ...result }, null, 2));
  if (result.findings.length) process.exitCode = 1;
}
