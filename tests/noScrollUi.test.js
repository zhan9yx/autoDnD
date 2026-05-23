import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("open table uses one-viewport shell with overlay drawers", async () => {
  const [html, css, app] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/styles.css", "utf8"),
    readFile("public/app.js", "utf8")
  ]);

  assert.match(html, /data-drawer="party"[^>]+inert/);
  assert.match(html, /data-drawer="state"[^>]+inert/);
  assert.match(html, /data-drawer="log"[^>]+inert/);
  assert.match(html, /id="drawerScrim"/);
  assert.match(html, /id="turnDock"/);
  assert.match(html, /id="fullTranscript"/);

  assert.match(css, /body\.table-active[\s\S]*overflow: hidden/);
  assert.match(css, /body\.table-active \.shell[\s\S]*height: 100dvh/);
  assert.match(css, /\.table[\s\S]*height: calc\(100dvh - 28px\)/);
  assert.match(css, /\.drawer-panel[\s\S]*position: fixed/);
  assert.match(css, /\.transcript-panel[\s\S]*grid-template-rows: auto auto auto minmax\(0, 1fr\) auto auto/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.party-drawer,[\s\S]*\.state-drawer,[\s\S]*\.log-drawer[\s\S]*transform: translateY\(100%\)/);

  assert.match(app, /document\.body\.classList\.add\("table-active"\)/);
  assert.match(app, /panel\.inert = !active/);
  assert.match(app, /panel\.inert = true/);
  assert.match(app, /entries\.slice\(-5\)/);
  assert.match(app, /drawerOpener/);
});
