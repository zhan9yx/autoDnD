import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("player table does not expose asset-management or director controls", async () => {
  const [html, app, i18n] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/app.js", "utf8"),
    readFile("public/i18n.js", "utf8")
  ]);
  const publicSurface = `${html}\n${app}\n${i18n}`;

  assert.doesNotMatch(publicSurface, /id="assetGrid"|id="assetSearch"|id="assetCategoryFilter"|id="assetShowAll"|id="assetDetail"/);
  assert.doesNotMatch(publicSurface, /asset-library|asset-grid|asset-tools|Asset Library|资产库/);
  assert.doesNotMatch(publicSurface, /data-drawer-open="gm"|data-drawer="gm"|gm-drawer/);
  assert.doesNotMatch(publicSurface, /panel\.director|Director|导演推进/);
  assert.doesNotMatch(publicSurface, /guide\.tab\.evaluation|guide\.eval|Memory Evaluation|记忆评测/);

  assert.match(html, /data-drawer-open="state"/);
  assert.match(html, /data-drawer-open="character"/);
  assert.match(html, /data-drawer-open="settings"/);
  assert.match(html, /id="partyStatusBar"/);
  assert.match(html, /id="inventoryList"/);
  assert.match(html, /id="dicePanel"/);
  assert.match(html, /name="channel"/);
  assert.match(html, /id="rewardToast"/);
  assert.match(app, /room\.presentation\?\.sceneAsset/);
  assert.match(app, /entry\.type === "reward"/);
  assert.match(app, /items\/use/);
  assert.match(app, /market\/sell/);
  assert.match(app, /\/memo/);
});
