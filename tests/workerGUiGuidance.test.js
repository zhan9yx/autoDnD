import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Worker G stage fallback derives visible backdrop axes from scene context", async () => {
  const app = await readFile("public/app.js", "utf8");

  assert.match(app, /function currentSceneVisualState\(\)[\s\S]*room\?\.soundscape\?\.sceneVisualState[\s\S]*room\?\.presentation\?\.sceneVisualState[\s\S]*deriveSceneVisualStateFromRoom\(\)/);
  assert.match(app, /function deriveSceneVisualStateFromRoom\(nextRoom = room\)[\s\S]*nextRoom\.presentation\?\.sceneAsset\?\.variantAxes[\s\S]*scene\.location[\s\S]*scene\.weather[\s\S]*scene\.season[\s\S]*stateSummary\?\.latestChange/);
  assert.match(app, /const pressure = assetAxes\.pressure \|\| \(danger >= 5 \? "crisis" : danger >= 3 \? "high" : clues >= 3 \? "rising" : "low"\)/);
  assert.match(app, /function visualWeatherFromText\(text\)[\s\S]*return "clear"[\s\S]*return "storm"[\s\S]*return "wet"/);
  assert.match(app, /function visualLocationFromText\(text\)[\s\S]*return "city-street"[\s\S]*return "market-city"[\s\S]*return "archive-room"/);
  assert.match(app, /variantKey[\s\S]*`pressure:\$\{pressure\}`[\s\S]*`rain:\$\{rain\}`[\s\S]*`wind:\$\{wind\}`/);
});
