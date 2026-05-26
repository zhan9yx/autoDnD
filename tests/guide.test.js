import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const coreSections = [
  /##\s+Rooms/i,
  /##\s+Character\s+Creation/i,
  /##\s+Actions\s+And\s+Chat/i,
  /##\s+Ambience\s+And\s+Environment\s+Audio/i,
  /##\s+Weather,\s+Seasons,\s+And\s+Audio\s+Cues/i,
  /##\s+Scene,\s+State,\s+And\s+Replay/i,
  /##\s+Host\s+Guide/i,
  /##\s+Recovery\s+And\s+Reconnect/i,
  /##\s+Step\s+7:\s+Read\s+Combat\s+State/i,
  /##\s+Step\s+8:\s+Build\s+A\s+Replay/i,
  /##\s+Step\s+9:\s+Find\s+A\s+Reward/i,
  /##\s+Step\s+10:\s+Recover\s+Or\s+Reconnect/i,
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
  assert.match(tutorial, /## Step 10: Recover Or Reconnect/);
  assert.match(tutorial, /## Step 11: Run Evaluation/);
});

test("B9 guide expansion covers starter campaign, character hooks, host flow, recovery, and environment cues", async () => {
  await access("docs/SCENE_LIBRARY.md");
  await access("docs/OPERATIONS.md");
  await access("docs/qa/0012-guide-expansion.md");

  const [guide, tutorial, operations, sceneLibrary, qa] = await Promise.all([
    readFile("docs/USER_GUIDE.md", "utf8"),
    readFile("docs/BEGINNER_TUTORIAL.md", "utf8"),
    readFile("docs/OPERATIONS.md", "utf8"),
    readFile("docs/SCENE_LIBRARY.md", "utf8"),
    readFile("docs/qa/0012-guide-expansion.md", "utf8")
  ]);
  const combined = `${guide}\n${tutorial}\n${operations}\n${sceneLibrary}\n${qa}`;

  for (const phrase of [
    "Character Hook Starter",
    "Step-By-Step Player Manual",
    "Host Runbook",
    "Recovery Runbook",
    "Starter Campaign: The Rain Bell Ledger",
    "Scene Variety Plan Before New Images",
    "Seasonal Encounter Variants",
    "goal, fear, bond",
    "voice availability",
    "no new image assets"
  ]) {
    assert.match(combined, new RegExp(phrase, "i"), `missing B9 guide phrase: ${phrase}`);
  }

  for (const sceneName of [
    "Rain Bell Archive",
    "Glass Market Testimony",
    "Flooded Lock Road",
    "Bell Tower Parley",
    "Festival Bell Choice"
  ]) {
    assert.match(sceneLibrary, new RegExp(sceneName), `missing starter scene: ${sceneName}`);
  }
});

test("web UI exposes guide entry points and guide panel", async () => {
  const html = await readFile("public/index.html", "utf8");
  const app = await readFile("public/app.js", "utf8");
  const i18n = await readFile("public/i18n.js", "utf8");

  assert.match(html, /id="gatewayGuideButton"/);
  assert.match(html, /id="tableGuideButton"/);
  assert.match(html, /id="guideOverlay"/);
  assert.match(html, /data-guide-section="quickstart"/);
  assert.match(html, /data-card-select="speciesSelect"/);
  assert.match(html, /data-card-value="automaton"/);
  assert.match(html, /data-card-select="classSelect"/);
  assert.match(html, /data-card-value="envoy"/);
  assert.match(html, /id="warriorSpecializationGroup"/);
  assert.match(html, /name="specializationId"/);
  assert.match(app, /function openGuide/);
  assert.match(app, /function selectGuideTab/);
  assert.match(app, /STARTING_SPELL_CARD_STATE/);
  assert.match(app, /data-spell-state="\$\{STARTING_SPELL_CARD_STATE\.state\}"/);
  assert.match(app, /specializationId: String\(form\.get\("classId"\)/);
  assert.match(i18n, /spell\.stateKnown/);
  assert.match(i18n, /starting-known spells|起始已学法术/);
});
