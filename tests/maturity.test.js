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
