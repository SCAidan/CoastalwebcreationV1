// Independent pattern pass over every reachable historical text blob; never logs matched values.
import { execFileSync } from "node:child_process";
import { detectSecrets } from "./security-scan.mjs";
const commits = execFileSync("git", ["rev-list", "--all"], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean),
  seen = new Set(),
  findings = [];
for (const commit of commits) {
  const entries = execFileSync("git", ["ls-tree", "-r", commit], {
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  for (const entry of entries) {
    const [meta, path] = entry.split("\t");
    const sha = meta.split(" ")[2];
    if (seen.has(sha)) continue;
    seen.add(sha);
    if (
      !/\.(?:js|mjs|cjs|ts|json|md|txt|html|css|toml|ya?ml|sql|env|pem|key)$/.test(
        path,
      ) &&
      !/(?:^|\/)\.env/.test(path)
    )
      continue;
    const value = execFileSync("git", ["cat-file", "blob", sha], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    const rules = detectSecrets(value);
    if (rules.length) findings.push({ path, commit, rules });
  }
}
console.log(
  JSON.stringify(
    {
      scope: "reachable-git-history",
      commits: commits.length,
      uniqueBlobs: seen.size,
      findings,
    },
    null,
    2,
  ),
);
if (findings.length) process.exitCode = 1;
