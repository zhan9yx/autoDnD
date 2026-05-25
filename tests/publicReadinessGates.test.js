import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const requiredFiles = [
  ".harness/changes/0015-continuous-hardening/spec.md",
  ".harness/changes/0015-continuous-hardening/review.md",
  ".harness/changes/0015-continuous-hardening/tasks.md",
  ".harness/changes/0015-continuous-hardening/test-report.md",
  "docs/RELEASE_GATES.md",
  "docs/qa/0015-public-readiness-gates.md",
  "docs/qa/0015-release-evidence-index.md",
  "docs/SECURITY.md",
];

const gateIds = Array.from({ length: 8 }, (_, index) => `GATE-${String(index + 1).padStart(3, "0")}`);
const blockingDomains = [
  "Consolidated browser acceptance",
  "Deployment and staging parity",
  "Operations and data recovery",
  "Security and abuse controls",
  "Legal and privacy",
  "Load and reliability",
  "Support and launch operations",
];

function read(path) {
  return readFileSync(path, "utf8");
}

test("0015 public-readiness gate package is complete", () => {
  for (const path of requiredFiles) {
    assert.ok(existsSync(path), `${path} is required for the 0015 gate package`);
    assert.ok(read(path).trim().length > 200, `${path} should not be a placeholder`);
  }
});

test("release gates fail closed for every public-readiness blocker", () => {
  const gates = read("docs/RELEASE_GATES.md");
  const qa = read("docs/qa/0015-public-readiness-gates.md");

  for (const gateId of gateIds) {
    assert.match(gates, new RegExp(`\\| ${gateId} \\|`), `${gateId} missing from release gate matrix`);
    assert.match(qa, new RegExp(`${gateId} .*blocked`, "i"), `${gateId} missing blocked QA status`);
  }

  for (const domain of blockingDomains) {
    assert.match(gates, new RegExp(domain, "i"), `release gates missing ${domain}`);
  }

  assert.doesNotMatch(gates, /\| GATE-\d{3} \|[^|\n]+\| passed \|/i);
  assert.doesNotMatch(qa, /GATE-\d{3} [^:\n]+: passed/i);
  assert.match(gates, /Passing `npm run harness:check`.*does not pass any public-readiness gate/i);
});

test("readiness status docs point to 0015 gates without closing them", () => {
  const roadmap = read("docs/ROADMAP.md");
  const gapAssessment = read("docs/GAP_ASSESSMENT.md");
  const maturity = read("docs/MATURITY_AUDIT.md");
  const operations = read("docs/OPERATIONS.md");
  const security = read("docs/SECURITY.md");
  const bugs = read("docs/BUGS.md");

  for (const [name, text] of Object.entries({ roadmap, gapAssessment, maturity, operations, security, bugs })) {
    assert.match(text, /docs\/RELEASE_GATES\.md|GATE-00[1-8]|0015-continuous-hardening/i, `${name} must reference the 0015 release gates`);
  }

  assert.match(gapAssessment, /remaining gap is public-product readiness/i);
  assert.match(maturity, /not yet a mature public-launch product/i);
  assert.match(bugs, /BUG-0013/);
  assert.match(security, /not a production security program/i);
});
