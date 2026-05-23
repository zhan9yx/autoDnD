import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("static table UI keeps status summary, hidden drawer defaults, and reward toast state hooks", async () => {
  const [html, app, css] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/app.js", "utf8"),
    readFile("public/styles.css", "utf8")
  ]);

  assert.match(html, /<section class="table-state-strip"[^>]+aria-label="Current table state"/);
  assert.match(html, /id="turnDock"[\s\S]*id="roundDock"[\s\S]*id="encounterDock"[\s\S]*id="syncDock"/);
  assert.match(html, /id="stateSummary"/);
  assert.match(html, /id="stateChangeList"/);
  assert.match(app, /renderStateSummary/);
  assert.match(app, /room\.stateSummary/);
  assert.match(css, /\.state-summary-grid\s*\{/);
  assert.match(app, /turnDock: document\.querySelector\("#turnDock"\)/);
  assert.match(app, /roundDock: document\.querySelector\("#roundDock"\)/);
  assert.match(app, /encounterDock: document\.querySelector\("#encounterDock"\)/);
  assert.match(app, /syncDock: document\.querySelector\("#syncDock"\)/);
  assert.match(app, /els\.turnDock\.textContent = els\.turnBadge\.textContent/);
  assert.match(app, /els\.syncDock\.textContent = t\(uiLanguage, key\)/);
  assert.match(css, /\.table-state-strip\s*\{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);

  assert.match(html, /data-drawer="party"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(html, /data-drawer="state"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(html, /data-drawer="log"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(css, /\.drawer-panel\s*\{[\s\S]*opacity: 0;[\s\S]*pointer-events: none;[\s\S]*visibility: hidden;/);
  assert.match(css, /\.drawer-panel\.open\s*\{[\s\S]*opacity: 1;[\s\S]*pointer-events: auto;[\s\S]*visibility: visible;/);
  assert.match(app, /panel\.classList\.toggle\("open", active\)/);
  assert.match(app, /panel\.inert = !active/);
  assert.match(app, /panel\.inert = true/);

  assert.match(html, /<div class="reward-toast hidden" id="rewardToast"[^>]+aria-hidden="true"/);
  assert.match(app, /shownRewardEventIds/);
  assert.match(app, /els\.rewardToast\.classList\.remove\("hidden"\)/);
  assert.match(app, /els\.rewardToast\.setAttribute\("aria-hidden", "false"\)/);
  assert.match(app, /els\.rewardToast\.classList\.add\("hidden"\)/);
  assert.match(app, /els\.rewardToast\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(css, /\.hidden\s*\{[\s\S]*display: none !important;[\s\S]*\}/);
  assert.match(css, /\.reward-toast\s*\{[\s\S]*position: fixed;[\s\S]*z-index: 34;/);
});
