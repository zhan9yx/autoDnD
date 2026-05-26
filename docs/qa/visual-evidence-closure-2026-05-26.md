# Visual Evidence Closure

Date: 2026-05-26 CST
Worker: AC visual evidence closure
Scope: fresh local desktop/mobile screenshot evidence only. No business code was changed.

## Existing Evidence Check

`docs/qa` already contained useful visual/e2e evidence, but it was not sufficient for the current 2026-05-26 dirty tree:

- `docs/qa/0015-consolidated-browser-acceptance.md` records the 2026-05-25 local desktop/mobile browser pack.
- `docs/qa/0017-mobile-log-toast-density.md` records a focused 390px mobile toast/log density pass.
- `docs/qa/release-evidence-2026-05-26.md` explicitly says fresh desktop/mobile screenshots for the current dirty tree were still missing.

Playwright was requested, but this checkout has no `node_modules`, no Playwright dependency, and `node -e "import('playwright')"` returned `ERR_MODULE_NOT_FOUND`. I used the repo's existing local-browser evidence pattern instead: headless Google Chrome via Chrome DevTools Protocol against an isolated local server.

## Run Setup

Server:

```bash
PORT=4246 AIDM_DATA_FILE=/private/tmp/aidm-ac-visual-closure/store.json npm run dev
```

Health:

```json
{
  "ok": true,
  "service": "aidm",
  "version": "0.11.0-production-depth",
  "store": "json",
  "aiProvider": "local"
}
```

Screenshot runner:

```bash
AIDM_BROWSER_BASE_URL=http://127.0.0.1:4246 \
AIDM_EVIDENCE_DIR=/private/tmp/aidm-ac-visual-closure \
node /private/tmp/aidm-ac-visual-runner.mjs
```

The runner produced 12 screenshots. Its machine report marked the run non-green because it treated a hidden empty toast image as a broken image and captured generic `Uncaught` runtime exceptions without useful stack details. Later cleanup reruns hit CDP `Runtime.evaluate` timeouts. I used the completed screenshots, isolated store data, and smoke result below for the final visual conclusion.

## Fresh Screenshot Paths

| Area | Screenshot |
| --- | --- |
| Desktop main table, situation strip, party rail, log area, action hint | `/private/tmp/aidm-ac-visual-closure/screenshots/01-desktop-main-action-ready.png` |
| Desktop after visible action submission | `/private/tmp/aidm-ac-visual-closure/screenshots/02-desktop-action-result.png` |
| Desktop situation expanded | `/private/tmp/aidm-ac-visual-closure/screenshots/03-desktop-situation-expanded.png` |
| Desktop state drawer | `/private/tmp/aidm-ac-visual-closure/screenshots/04-desktop-state-drawer.png` |
| Desktop full log drawer | `/private/tmp/aidm-ac-visual-closure/screenshots/05-desktop-log-drawer.png` |
| Desktop market drawer | `/private/tmp/aidm-ac-visual-closure/screenshots/06-desktop-market-drawer.png` |
| Desktop character/backpack/leveling drawer | `/private/tmp/aidm-ac-visual-closure/screenshots/07-desktop-backpack-leveling.png` |
| Mobile main table after action, 390x844 | `/private/tmp/aidm-ac-visual-closure/screenshots/08-mobile-main-after-action.png` |
| Mobile situation expanded, 390x844 | `/private/tmp/aidm-ac-visual-closure/screenshots/09-mobile-situation-expanded.png` |
| Mobile full log drawer, 390x844 | `/private/tmp/aidm-ac-visual-closure/screenshots/10-mobile-log-drawer.png` |
| Mobile market drawer, 390x844 | `/private/tmp/aidm-ac-visual-closure/screenshots/11-mobile-market-drawer.png` |
| Mobile character/backpack/leveling drawer, 390x844 | `/private/tmp/aidm-ac-visual-closure/screenshots/12-mobile-backpack-leveling.png` |

## Visual Findings

No broad layout collapse was visible in the main play surface:

- Desktop main table fits within 1440x960: topbar, situation strip, three-player party rail, stage, log panel, and action form do not visibly overlap.
- Mobile main table fits within 390x844: topbar wraps into two rows, party rail remains usable, situation expansion stays in viewport, and the action form remains reachable.
- Desktop and mobile market drawers are usable. Cards, prices, disabled buy states, and scroll affordance are visible.
- The state drawer opens and the high-level situation page is readable on desktop; the mobile situation strip is dense but usable.
- No reward toast obstruction was visible in the final screenshots. The fresh run did not keep a visible toast on screen long enough to capture, so this pass can only say no toast overlap was observed, not that toast presence is freshly re-proven. The focused 0017 mobile toast pass remains the stronger toast-specific evidence.

Two product-visible issues remain in the fresh screenshots:

- Full log drawer appears blank on both desktop and mobile. The drawer opens, but it shows `0 条记录` and no transcript content in `05-desktop-log-drawer.png` and `10-mobile-log-drawer.png`. The isolated store for the same visual room contains 11 transcript entries, including `gm`, `system`, `economy`, `inventory`, `player`, `roll`, and `reward`, so this is not just an empty-room state.
- Character/backpack/leveling drawer does not render the available inventory/progression detail. The desktop and mobile drawer screenshots show Iris, wallet, HP/MP, and vitals, but the backpack list is empty and the leveling summary area is visually blank. The isolated store for the same room has Iris at level 2 with 120 XP, 5 inventory items, 6 spells, and `recover-mana`.

These look like render/runtime issues inside drawer content rather than simple density, overlap, or viewport sizing problems.

## Minimal Smoke

Command:

```bash
npm run smoke http://127.0.0.1:4246
```

Result: passed.

Key output:

```json
{
  "ok": true,
  "assetCount": 82,
  "generatedAssetCount": 1582,
  "marketOffers": 75,
  "purchasedItem": "storm-lantern",
  "rewardItem": "mana-tonic",
  "levelUp": {
    "level": 2,
    "learnedSpells": ["ember-lance"],
    "progressionActions": ["recover-mana"]
  },
  "transcript": 15,
  "replayHighlights": 4
}
```

## Closure Decision

Fresh desktop/mobile screenshot evidence now exists for the current dirty tree, but visual signoff is not clean.

Do dispatch a UI fix worker. Scope it narrowly to:

1. Full log drawer transcript count/content rendering.
2. Character drawer inventory, equipment/spells/progression rendering after level-up and reward.
3. A recapture of desktop/mobile log and backpack drawers after the fix.

No broad redesign worker is needed from this pass; the main table, situation strip, party rail, market drawer, and action area are visually usable.
