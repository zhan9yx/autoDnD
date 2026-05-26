# Generated Asset Exposure Final Audit

Date: 2026-05-26 CST
Auditor: AD, final generated asset exposure auditor
Scope: final risk judgement for direct generated PNG references in runtime/source/test/docs. This audit is documentation-only and intentionally excludes this audit file from the baseline reference counts.

## Summary

Final judgement: the 102 untracked generated PNGs found by commit batching are real player-visible runtime dependencies, not merely test or documentation references. The manifest does not currently mark those 102 assets as player-safe. Every one of the 102 entries is still `visibility: internal`, `uiSurface: ["catalog-internal"]`, and `quality.approved: false`.

This is a release-boundary mismatch. It is acceptable only as a temporary dirty-worktree exception while the runtime code, manifest, and asset files are still being batched. It should not be accepted for merge or release without one of the follow-up actions below.

No code or manifest fix was applied in this audit because there is not enough evidence to safely bulk-promote the 102 assets to player-safe metadata. Six of the directly referenced assets are still `accept-with-risk` rows, and the current focused manifest test explicitly asserts that the Kepler non-scene icons and cutouts remain internal until promotion. A bulk metadata promotion would be a policy change, not a small correction.

## Baseline Direct Reference Counts

Literal generated PNG references were counted across `src`, `public`, `tests`, `docs`, and `scripts`.

| Bucket | Files with refs | Occurrences | Unique PNG refs | Player-visible |
| --- | ---: | ---: | ---: | --- |
| Runtime/source (`src` + `public`) | 6 | 293 | 209 | Yes for the player UI paths listed below |
| Tests | 7 | 68 | 57 | No, validation only |
| Docs | 54 | 1460 | 912 | No, provenance/evidence only |
| Scripts | 2 | 27 | 27 | No, registration/planning tooling only |

Runtime/source file split:

| File | Occurrences | Unique PNG refs | Unique untracked PNG refs | Player-visible path |
| --- | ---: | ---: | ---: | --- |
| `public/app.js` | 102 | 69 | 32 | Direct browser rendering fallbacks for spell, rule, and leveling card art |
| `public/index.html` | 16 | 16 | 0 | Character option images, already tracked |
| `public/styles.css` | 1 | 1 | 0 | Static CSS background, already tracked |
| `src/core/itemCatalog.js` | 71 | 71 | 17 | Market, inventory, reward, and loot item art returned to the player UI |
| `src/core/rules.js` | 87 | 85 | 85 | Character class art, specialization art, spell/rule/status/action art returned to the player UI |
| `src/core/optionAssets.js` | 16 | 16 | 0 | Character option image registry, already tracked |

The untracked runtime references total 102 unique PNGs because `public/app.js`, `src/core/rules.js`, and `src/core/itemCatalog.js` overlap. The file-level counts are 32, 85, and 17 respectively, but the union is 102.

## Manifest Metadata Findings

All 102 untracked runtime-referenced assets are present in `assets/generated/manifest.json`; none are missing from the manifest.

Manifest status for the 102 direct runtime dependencies:

| Manifest group | Count | Size | Visibility | Review status |
| --- | ---: | ---: | --- | --- |
| `characters/generated-character-review` | 13 | 3.8 MiB | `internal` | `metadata-registered-internal` |
| `equipment/generated-metadata-review` | 17 | 4.0 MiB | `internal` | `metadata-registered-internal` |
| `rules/generated-rules-review` | 20 | 3.2 MiB | `internal` | `metadata-registered-internal` |
| `rules/generated-rules-review` | 6 | 1.4 MiB | `internal` | `accept-with-risk` |
| `spells/generated-spell-review` | 46 | 9.5 MiB | `internal` | `metadata-registered-internal` |

Aggregate manifest gate state:

- 102/102 have `visibility: internal`.
- 102/102 have `uiSurface: ["catalog-internal"]`.
- 102/102 have `quality.approved: false`.
- 96/102 have `quality.reviewStatus: metadata-registered-internal`.
- 6/102 have `quality.reviewStatus: accept-with-risk`, including alpha-edge risk.
- The asset rows do not carry separate per-asset `access` or `audience` fields. In this manifest schema, the effective runtime exposure fields are `visibility`, `uiSurface`, `quality`, and `gameplayBinding`; sheet-level `classification` exists separately and is not enough to make these asset rows player-safe.

## Player UI Exposure Analysis

The references are player-visible, not only source-internal:

- `src/core/itemCatalog.js` stores generated asset refs on item definitions. Those definitions flow through `shopView`, `inventoryView`, `describeInventoryEntry`, catalog loot pools, reward transcript entries, and market buy/sell flows. `public/app.js` renders them through `itemArtMarkup`, market cards, inventory detail/list art, reward cards, and reward toast art.
- `src/core/rules.js` stores generated asset refs on rule bindings. Those bindings flow through `createCharacter`, `classArt`, warrior specialization art, spell rule cards, combat skill rule cards, and status effect art. `public/app.js` renders them through `ruleAssetMarkup`, `spellArtMarkup`, leveling summary cards, choice cards, chips, and starter spell cards.
- `public/app.js` also contains direct browser-side fallbacks for a subset of the same spell/rule images, so even if server metadata were absent, the browser can still render internal-marked files directly.

That means manifest `internal` is not merely "available inside the catalog for future use" once these source bindings are active. The runtime is treating them as promoted assets, while the manifest still says catalog-internal and not approved for direct player exposure.

## Final Risk Decision

Decision: no automatic metadata promotion in this audit.

Reasoning:

- The mismatch is real and release-blocking unless explicitly accepted by the release owner.
- A correct manifest fix would need to distinguish source-level runtime promotion from raw catalog browsing and assign concrete player surfaces such as market item, inventory item, rule card, spell card, class badge, status chip, and item detail.
- Six directly referenced assets still carry risk status, so blanket promotion to approved player-safe would overstate QA evidence.
- Existing focused manifest tests currently enforce the internal boundary for the Kepler non-scene icons and cutouts. Changing that contract is broader than a small metadata typo fix.
- The runtime code currently also has direct browser fallbacks in `public/app.js`; the allowed fix scope for this audit does not include that file, so a source-only cleanup would be incomplete.

Temporary acceptance:

- Accept the current state only as a dirty-worktree, pre-merge transition.
- Do not treat the 102 assets as release-safe merely because tests pass.
- Do not stage runtime code that references these 102 files unless the files are staged with it, preferably through the selected generated-asset storage strategy.

## Required Follow-up Strategy

Before merge or release, choose one path:

1. Promote the exact 102 runtime-bound assets in the manifest, with specific player surfaces and updated focused tests. This should not be a blanket promotion for all internal Kepler assets.
2. Remove or retarget the hard-coded runtime references to already tracked, approved player-safe assets.
3. Add an explicit manifest concept for `runtimePromotion`, keeping raw catalog access internal while allowing audited source-bound usage, then update runtime tests and manifest tests to assert that boundary.

Storage and batching remain separate but related: the 102 files are runtime dependencies and must be committed with the runtime code or made available through the selected asset delivery path.

## Commands Run

Reference and metadata counting:

```bash
node --input-type=module -e '<scan src/public/tests/docs/scripts for generated PNG refs and intersect runtime refs with untracked files plus manifest metadata>'
```

Result:

- Runtime/source: 6 files, 293 occurrences, 209 unique refs.
- Tests: 7 files, 68 occurrences, 57 unique refs.
- Docs: 54 files, 1460 occurrences, 912 unique refs.
- Scripts: 2 files, 27 occurrences, 27 unique refs.
- Runtime/source untracked unique refs: 102.
- Missing manifest metadata for runtime/source untracked refs: 0.

Focused tests:

```bash
node --test tests/generatedManifestRegistration.test.js tests/itemCatalog.test.js tests/itemEconomy.test.js tests/levelingSkills.test.js tests/levelingUi.test.js tests/playerUiAccess.test.js
```

Result: passed, 35/35 tests.

Diff hygiene:

```bash
git diff --check
```

Result: passed.
