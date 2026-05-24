import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const coreSections = [
  /##\s+Rooms/i,
  /##\s+Character\s+Creation/i,
  /##\s+Actions\s+And\s+Chat/i,
  /##\s+Ambience\s+And\s+Environment\s+Audio/i,
  /##\s+Scene,\s+State,\s+And\s+Replay/i,
  /##\s+Step\s+7:\s+Read\s+Combat\s+State/i,
  /##\s+Step\s+8:\s+Build\s+A\s+Replay/i,
  /##\s+Step\s+9:\s+Find\s+A\s+Reward/i,
  /##\s+Long-Memory\s+Evaluation/i
];

test("guide documents exist and cover core user flows", async () => {
  await access("docs/USER_GUIDE.md");
  await access("docs/BEGINNER_TUTORIAL.md");

  const guide = await readFile("docs/USER_GUIDE.md", "utf8");
  const tutorial = await readFile("docs/BEGINNER_TUTORIAL.md", "utf8");
  const combined = `${guide}\n${tutorial}`;

  for (const sectionPattern of coreSections) {
    assert.match(combined, sectionPattern);
  }

  assert.match(tutorial, /## Step 1: Open A Room/);
  assert.match(tutorial, /## Step 9: Find A Reward/);
  assert.match(tutorial, /## Step 10: Run Evaluation/);
});

test("web UI exposes guide entry points and guide panel", async () => {
  const html = await readFile("public/index.html", "utf8");
  const app = await readFile("public/app.js", "utf8");

  assert.match(html, /id="gatewayGuideButton"/);
  assert.match(html, /id="tableGuideButton"/);
  assert.match(html, /id="guideOverlay"/);
  assert.match(html, /data-guide-section="quickstart"/);
  assert.match(app, /function openGuide/);
  assert.match(app, /function selectGuideTab/);
});
