import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("maturity audit states local-alpha and public-launch boundaries", async () => {
  const audit = await readFile("docs/MATURITY_AUDIT.md", "utf8");

  assert.match(audit, /not yet a mature public-launch product/i);
  assert.match(audit, /Harness/i);
  assert.match(audit, /production account/i);
  assert.match(audit, /content safety/i);
  assert.match(audit, /public beta/i);
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
