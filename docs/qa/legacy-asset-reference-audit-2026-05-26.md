# Legacy Asset Reference Audit

Date: 2026-05-26 CST
Auditor: U, runtime generated PNG exposure

## Scope

This pass focused only on runtime direct references to `assets/generated/**/*.png` in `src` and `public`, then intersected those references with git-untracked generated files and `assets/generated/manifest.json` metadata.

I did not run the full harness, full npm test suite, browser QA, or broad asset resolver rewrites.

## Runtime Direct Reference Counts

Current runtime direct generated PNG references across `src` and `public`:

| Set | Occurrences | Unique PNG refs | Manifest entries missing |
| --- | ---: | ---: | ---: |
| All runtime generated PNG refs | 312 | 209 | 0 |
| Untracked runtime generated PNG refs | 152 | 102 | 0 |

All-runtime unique refs by category:

| Category | Unique refs |
| --- | ---: |
| item | 91 |
| spell | 62 |
| icon | 45 |
| status | 10 |
| scene | 1 |

Untracked/runtime-promoted risk-set unique refs by category:

| Category | Unique refs |
| --- | ---: |
| spell | 46 |
| icon | 29 |
| item | 17 |
| status | 10 |
| scene | 0 |

Runtime file split:

| File | Occurrences | Unique PNG refs | Unique untracked refs | Untracked categories |
| --- | ---: | ---: | ---: | --- |
| `public/app.js` | 118 | 85 | 32 | spell: 21, icon: 11 |
| `public/index.html` | 16 | 16 | 0 | none |
| `public/styles.css` | 1 | 1 | 0 | none |
| `src/core/itemCatalog.js` | 74 | 74 | 19 | item: 17, spell: 2 |
| `src/core/optionAssets.js` | 16 | 16 | 0 | none |
| `src/core/rules.js` | 87 | 85 | 85 | spell: 46, icon: 29, status: 10 |

File-level untracked counts overlap. The union is 102 unique PNG files.

## Untracked Runtime-Promoted Risk Set

| Asset path pattern | Count | Category | Manifest bucket | Review status | Runtime files |
| --- | ---: | --- | --- | --- | --- |
| `assets/generated/icons/aidm-action-icon-042-{01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16}.png` | 16 | icon | `rules/generated-rules-review` | `metadata-registered-internal` | `public/app.js`, `src/core/rules.js` |
| `assets/generated/items/aidm-armor-outfit-cutout-053-{03,21}.png` | 2 | item | `equipment/generated-metadata-review` | `metadata-registered-internal` | `src/core/itemCatalog.js` |
| `assets/generated/icons/aidm-class-badge-046-{01,02,03,04,05,06,07,08,09,10,11,12,13}.png` | 13 | icon | `characters/generated-character-review` | `metadata-registered-internal` | `src/core/rules.js` |
| `assets/generated/items/aidm-consumable-provision-054-{01,06,20,27}.png` | 4 | item | `equipment/generated-metadata-review` | `metadata-registered-internal` | `src/core/itemCatalog.js` |
| `assets/generated/items/aidm-scroll-icon-044-{01,02,03,04,05,06,07,08,09,10,11,12,13,14}.png` | 14 | spell | `spells/generated-spell-review` | `metadata-registered-internal` | `public/app.js`, `src/core/rules.js` |
| `assets/generated/spells/aidm-spell-icon-043-{01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16}.png` | 16 | spell | `spells/generated-spell-review` | `metadata-registered-internal` | `public/app.js`, `src/core/rules.js` |
| `assets/generated/spells/aidm-spell-scroll-rune-057-{01,05,07,08,09,10,11,12,16,19,30,31,32,34,35,40}.png` | 16 | spell | `spells/generated-spell-review` | `metadata-registered-internal` | `public/app.js`, `src/core/itemCatalog.js`, `src/core/rules.js` |
| `assets/generated/icons/aidm-status-hazard-058-{08,11,17,20,23,33}.png` | 6 | status | `rules/generated-rules-review` | `accept-with-risk` | `src/core/rules.js` |
| `assets/generated/icons/aidm-status-icon-045-{01,02,03,04}.png` | 4 | status | `rules/generated-rules-review` | `metadata-registered-internal` | `src/core/rules.js` |
| `assets/generated/items/aidm-tool-clue-055-{03,10,25,27,39}.png` | 5 | item | `equipment/generated-metadata-review` | `metadata-registered-internal` | `src/core/itemCatalog.js` |
| `assets/generated/items/aidm-treasure-material-056-{05,06,33,64}.png` | 4 | item | `equipment/generated-metadata-review` | `metadata-registered-internal` | `src/core/itemCatalog.js` |
| `assets/generated/items/aidm-weapon-cutout-052-{01,56}.png` | 2 | item | `equipment/generated-metadata-review` | `metadata-registered-internal` | `src/core/itemCatalog.js` |

## Manifest Access Findings

All 102 untracked runtime-referenced PNG files are present in `assets/generated/manifest.json`. Current manifest state is no longer `internal`; the rows have been source-bound promoted for audited runtime UI only:

| Manifest field | Count |
| --- | ---: |
| `visibility: runtime-promoted` | 102 |
| `uiSurface: ["ui-approved-runtime"]` | 102 |
| `quality.approved: false` | 102 |
| `quality.reviewStatus: metadata-registered-internal` | 96 |
| `quality.reviewStatus: accept-with-risk` | 6 |
| `gameplayBinding.runtimePromotionRequired: false` | 102 |
| `runtimePromotion.status: ui-approved-runtime` | 102 |

The manifest rows do not have per-asset `access`, `audience`, or `classification` fields. The effective access/audience gate for runtime selection is `visibility`, `uiSurface`, `quality.approved`, and `quality.reviewStatus`.

## Fix Applied

One clear false binding was fixed:

- `src/core/itemCatalog.js`: `leather` no longer points at untracked/internal `assets/generated/items/aidm-equipment-tool-047-09.png` with `accept-with-metadata-risk`.
- `src/core/itemCatalog.js`: `leather` now points at tracked/player-safe `assets/generated/items/aidm-wearable-cutout-023-02.png`.
- `tests/itemCatalog.test.js`: updated the focused assertion for that binding.

Before this small fix the current scan found 103 untracked runtime refs. After the fix it finds 102.

## Remaining Risk

The remaining 102 refs are not a false positive. They are reachable through player-visible paths:

- `src/core/itemCatalog.js` flows into shop, inventory, item detail, rewards, and buy/sell UI.
- `src/core/rules.js` flows into spell cards, rule cards, class/specialization art, status icons, and leveling UI.
- `public/app.js` has direct browser fallbacks for a subset of the same rule/spell/icon art.

The current manifest uses a source-bound `runtime-promoted` state, not broad `player-safe` promotion. That is the correct direction if the release owner accepts runtime-only exposure, but it still leaves two release constraints:

- The 102 PNG files remain untracked file dependencies and must be committed or otherwise delivered with the runtime code.
- `quality.approved` remains false for all 102, and 6 status/hazard assets still carry `accept-with-risk`; they should not enter broad player-safe catalog or resolver pools without separate visual QA.
