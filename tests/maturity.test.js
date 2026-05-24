import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const depthGateDomains = ["Assets", "Logs", "Audio", "UI", "Economy", "Evaluation"];

test("maturity audit states local-alpha and public-launch boundaries", async () => {
  const audit = await readFile("docs/MATURITY_AUDIT.md", "utf8");

  assert.match(audit, /not yet a mature public-launch product/i);
  assert.match(audit, /Harness/i);
  assert.match(audit, /production account/i);
  assert.match(audit, /content safety/i);
  assert.match(audit, /public beta/i);
});

test("maturity audit blocks regression to MVP-only gates", async () => {
  const audit = await readFile("docs/MATURITY_AUDIT.md", "utf8");

  assert.match(audit, /no longer a thin MVP/i);
  assert.match(audit, /must not regress to a smoke-test-only MVP/i);
  assert.match(audit, /generated manifest baseline/i);
  assert.match(audit, /assets\/generated\/manifest\.json/i);

  for (const domain of depthGateDomains) {
    assert.match(audit, new RegExp(`${domain} gate:`, "i"), `maturity audit missing ${domain} gate`);
  }
});

test("roadmap and bug tracker preserve 0012 continuous-depth gates", async () => {
  const [roadmap, bugs, packageJsonText] = await Promise.all([
    readFile("docs/ROADMAP.md", "utf8"),
    readFile("docs/BUGS.md", "utf8"),
    readFile("package.json", "utf8"),
  ]);
  const packageJson = JSON.parse(packageJsonText);

  assert.match(roadmap, /## 0012 Continuous-Depth Guardrail/);
  assert.match(roadmap, /## 0012 Product Gap Landing Batch B/);
  assert.match(roadmap, /REQ-261` through `REQ-280/);
  assert.match(roadmap, /Runtime follow-up required/i);
  assert.match(roadmap, /thin MVP/i);
  assert.match(roadmap, /Market action turn-cost remains a product decision/i);
  assert.match(roadmap, /3000\+ generated asset and 500-scene targets/i);

  for (const domain of depthGateDomains) {
    assert.match(roadmap, new RegExp(`${domain}:`, "i"), `roadmap missing ${domain} gate`);
  }

  for (const bugId of ["BUG-0004", "BUG-0005", "BUG-0006"]) {
    assert.match(bugs, new RegExp(`## ${bugId}`), `${bugId} should stay tracked`);
  }
  assert.match(bugs, /Status: open in `0012-continuous-depth-assets`/);

  for (const script of [
    "test",
    "lint",
    "eval:memory",
    "eval:production-depth",
    "smoke",
    "simulate:campaign",
    "harness:check",
  ]) {
    assert.equal(typeof packageJson.scripts[script], "string", `${script} release gate script is missing`);
  }
});

test("harness check documents no-report evals and localhost-required gates", async () => {
  const [harness, packageJsonText] = await Promise.all([
    readFile("scripts/harness.mjs", "utf8"),
    readFile("package.json", "utf8"),
  ]);
  const packageJson = JSON.parse(packageJsonText);

  assert.match(harness, /documentedCommand: "npm run eval:memory:16h -- --no-report"/);
  assert.match(harness, /args: \["run", "eval:memory:16h", "--", "--no-report"\]/);
  assert.match(harness, /documentedCommand: "npm run eval:production-depth"/);
  assert.match(harness, /\[harness\] report mode: no-report/);
  assert.match(harness, /documentedCommand: "npm run test"[\s\S]*localhostRequired: true/);
  assert.match(harness, /documentedCommand: "npm run smoke"[\s\S]*localhostRequired: true/);
  assert.match(harness, /listen\/connect EPERM on localhost/);
  assert.doesNotMatch(harness, /run\("npm", \["run", "eval:memory"\]\)/);
  assert.match(packageJson.scripts["eval:production-depth"], /--no-report/);
  assert.match(packageJson.scripts["eval:memory:16h"], /campaign-history-16h\.json/);
});

test("production-depth QA closeout does not overstate public-launch maturity", async () => {
  const closeout = await readFile("docs/qa/0011-production-depth-closeout.md", "utf8");

  assert.match(closeout, /Accepted for local v11 handoff/i);
  assert.match(closeout, /Not accepted as public launch maturity/i);
  assert.match(closeout, /production account/i);
  assert.match(closeout, /moderation/i);
  assert.match(closeout, /rate limit/i);
  assert.match(closeout, /privacy deletion/i);
  assert.match(closeout, /Merge Risk List/i);
  assert.match(closeout, /Market action turn-cost remains unresolved/i);
});
