import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { t } from "../public/i18n.js";

test("Worker I active player guidance distinguishes local, other, chat, and pending states", async () => {
  const app = await readFile("public/app.js", "utf8");
  const css = await readFile("public/styles.css", "utf8");

  assert.match(app, /const guidance = currentActionGuidanceState\(intent === "chat"\);[\s\S]*if \(!guidance\.canSubmit\)[\s\S]*guidance\.submitErrorKey/);
  assert.match(app, /function currentActionTurnState\(\)[\s\S]*pending\?\.status === "pending"[\s\S]*owner: "no-local"[\s\S]*owner: "no-active"[\s\S]*owner: "local"[\s\S]*owner: "other"/);
  assert.match(app, /function currentActionGuidanceState\(isChat = false\)[\s\S]*action\.hint\.chatLocal[\s\S]*action\.hint\.chatOther[\s\S]*action\.hint\.chatNoActive[\s\S]*action\.hint\.pending/);
  assert.match(app, /function currentActionGuidanceState\(isChat = false\)[\s\S]*action\.hint\.localTurn[\s\S]*action\.hint\.otherTurn[\s\S]*action\.hint\.noActive/);
  assert.match(app, /els\.actionForm\.dataset\.actionState = canSubmit \? "ready" : "blocked"/);
  assert.match(app, /els\.actionForm\.dataset\.guidanceOwner = guidance\.owner/);
  assert.match(app, /submitButton\.disabled = !canSubmit/);
  assert.match(app, /els\.actionModeHint\.textContent = t\(uiLanguage, guidance\.hintKey, \{ name: guidance\.activeName \}\)/);

  assert.match(css, /\.action-form\[data-action-state="blocked"\]\s*\{/);
  assert.match(css, /\.action-form\[data-guidance-owner="other"\] button:disabled,[\s\S]*\.action-form\[data-guidance-owner="pending"\] button:disabled/);

  for (const key of [
    "action.hint.localTurn",
    "action.hint.otherTurn",
    "action.hint.noActive",
    "action.hint.chatLocal",
    "action.hint.chatOther",
    "action.hint.chatNoActive",
    "action.hint.pending",
    "action.formAria.otherTurn",
    "action.formAria.noActive",
    "action.formAria.pending",
    "action.waitingSubmitError",
    "action.noActiveSubmitError",
    "action.pendingSubmitError"
  ]) {
    assert.notEqual(t("en", key, { name: "Mira" }), key);
    assert.notEqual(t("zh", key, { name: "米拉" }), key);
  }
});
