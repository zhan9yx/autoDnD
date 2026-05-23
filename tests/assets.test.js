import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("asset manifest indexes reusable visual assets", async () => {
  const manifest = JSON.parse(await readFile("assets/manifest.json", "utf8"));
  const allAssets = Object.values(manifest.groups).flat();

  assert.equal(manifest.version, 1);
  assert.equal(allAssets.length >= 80, true);
  assert.equal(manifest.groups.species.length >= 8, true);
  assert.equal(manifest.groups.classes.length >= 8, true);
  assert.equal(manifest.groups.scenes.length >= 10, true);
  assert.equal(manifest.groups.npcs.length >= 8, true);
  assert.equal(manifest.groups.enemies.length >= 12, true);

  for (const asset of allAssets) {
    assert.equal(Boolean(asset.id && asset.name && asset.file && asset.tags.length > 0), true);
    await access(asset.file);
  }
});
