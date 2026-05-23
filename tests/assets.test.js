import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("asset manifest indexes reusable visual assets", async () => {
  const manifest = JSON.parse(await readFile("assets/manifest.json", "utf8"));
  const allAssets = Object.values(manifest.groups).flat();

  assert.equal(manifest.version, 2);
  assert.equal(Array.isArray(manifest.marketplace?.categories), true);
  assert.equal(Array.isArray(manifest.generatedSheets), true);
  assert.equal(Array.isArray(manifest.rasterAssets), true);
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

test("asset generator emits raster-ready marketplace schema", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-assets-"));

  try {
    await execFileAsync(process.execPath, [resolve("scripts/generate-assets.mjs")], { cwd: tempDir });
    const manifest = JSON.parse(await readFile(join(tempDir, "assets/manifest.json"), "utf8"));
    const allAssets = Object.values(manifest.groups).flat();

    assert.equal(manifest.version, 2);
    assertManifestExtension(manifest);
    assert.deepEqual(manifest.generatedSheets, []);
    assert.deepEqual(manifest.rasterAssets, []);
    assert.equal(allAssets.length >= 80, true);

    for (const asset of allAssets) {
      assert.equal(asset.assetType, "vector");
      assert.equal(Boolean(asset.categoryId), true);
      assertLicense(asset.license);
      assertProvenance(asset.provenance);
      await access(join(tempDir, asset.file));
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("raster asset registrations can reference generated sprite sheets", () => {
  const manifest = {
    version: 2,
    license: {
      id: "chatgpt-image-generation",
      name: "ChatGPT image generation output",
      usage: "AIDM raster marketplace sprites."
    },
    provenance: {
      source: "ChatGPT image generation",
      generator: "chatgpt-image-generation",
      generatedAt: "2026-05-24T12:00:00.000+08:00"
    },
    marketplace: {
      categories: [
        {
          id: "characters",
          name: "Characters",
          groups: ["npcs", "enemies"],
          assetTypes: ["raster"]
        }
      ]
    },
    groups: {},
    generatedSheets: [
      {
        id: "sheet-characters-001",
        name: "Character Portrait Sheet 001",
        categoryId: "characters",
        assetType: "raster-sheet",
        file: "assets/generated/characters/sheet-characters-001.png",
        format: "png",
        dimensions: { width: 2048, height: 2048 },
        tile: { width: 512, height: 512, columns: 4, rows: 4 },
        assetIds: ["portrait-archive-keeper"],
        license: {
          id: "chatgpt-image-generation",
          name: "ChatGPT image generation output",
          usage: "AIDM raster marketplace sprites."
        },
        provenance: {
          source: "ChatGPT image generation",
          generator: "chatgpt-image-generation",
          promptId: "characters-001",
          generatedAt: "2026-05-24T12:00:00.000+08:00"
        }
      }
    ],
    rasterAssets: [
      {
        id: "portrait-archive-keeper",
        name: "Archive Keeper Portrait",
        group: "npcs",
        categoryId: "characters",
        assetType: "raster",
        sheetId: "sheet-characters-001",
        frame: { x: 0, y: 0, width: 512, height: 512 },
        tags: ["npcs", "portrait", "archive", "keeper"],
        license: {
          id: "chatgpt-image-generation",
          name: "ChatGPT image generation output",
          usage: "AIDM raster marketplace sprites."
        },
        provenance: {
          source: "ChatGPT image generation",
          generator: "chatgpt-image-generation",
          promptId: "characters-001",
          generatedAt: "2026-05-24T12:00:00.000+08:00"
        }
      }
    ]
  };

  assertManifestExtension(manifest);
  assertRasterRegistration(manifest);
});

function assertManifestExtension(manifest) {
  assertLicense(manifest.license);
  assertProvenance(manifest.provenance);
  assert.equal(Array.isArray(manifest.marketplace?.categories), true);
  assert.equal(manifest.marketplace.categories.length > 0, true);
  assert.equal(Array.isArray(manifest.generatedSheets), true);
  assert.equal(Array.isArray(manifest.rasterAssets), true);

  for (const category of manifest.marketplace.categories) {
    assert.equal(Boolean(category.id && category.name), true);
    assert.equal(Array.isArray(category.groups), true);
    assert.equal(Array.isArray(category.assetTypes), true);
  }
}

function assertRasterRegistration(manifest) {
  const sheetsById = new Map(manifest.generatedSheets.map((sheet) => [sheet.id, sheet]));

  for (const sheet of manifest.generatedSheets) {
    assert.equal(sheet.assetType, "raster-sheet");
    assert.equal(Boolean(sheet.id && sheet.name && sheet.categoryId && sheet.file), true);
    assert.equal(sheet.format, "png");
    assert.equal(sheet.dimensions.width > 0, true);
    assert.equal(sheet.dimensions.height > 0, true);
    assert.equal(sheet.tile.width > 0, true);
    assert.equal(sheet.tile.height > 0, true);
    assert.equal(Array.isArray(sheet.assetIds), true);
    assertLicense(sheet.license);
    assertProvenance(sheet.provenance);
  }

  for (const asset of manifest.rasterAssets) {
    assert.equal(asset.assetType, "raster");
    assert.equal(Boolean(asset.id && asset.name && asset.group && asset.categoryId), true);
    assert.equal(sheetsById.has(asset.sheetId), true);
    assert.equal(asset.frame.width > 0, true);
    assert.equal(asset.frame.height > 0, true);
    assert.equal(Array.isArray(asset.tags), true);
    assertLicense(asset.license);
    assertProvenance(asset.provenance);
  }
}

function assertLicense(license) {
  assert.equal(Boolean(license?.id && license?.name && license?.usage), true);
}

function assertProvenance(provenance) {
  assert.equal(Boolean(provenance?.source && provenance?.generator && provenance?.generatedAt), true);
}
