# 0012 Requirement Progress Ledger

Status: coordination ledger for continuing from 100 tracked roadmap requirements toward the 100-200 requirement range.

This is not a claim that 200 requirements are complete. It separates confirmed gate/runtime evidence from partial, blocked, and future work.

## Source Check

- `docs/TODO.md` is not present in the current tree; this ledger uses the current Harness tasks, `docs/ROADMAP.md`, `docs/BUGS.md`, and 0012 QA notes instead.
- `.harness/changes/0012-continuous-depth-assets/tasks.md` records the current 0012 release-gate and backlog state.
- Older blocked QA notes remain useful history, but the 217/217 post-patch baseline supersedes earlier 199/195, 206/202, 208/210, 210/210, and 213/213 intermediate results. Later workers added or updated tests, so a final staged full-suite run must establish the current canonical total.
- Third-round permission status: the macOS/OS sandbox EPERM blocker was cleared by user authorization, so Docs/Harness files can be reread again. The earlier `uv_cwd` and file-open failures remain useful incident history, not the current Docs/Harness access state.
- Euler and Sartre test patches landed after the 213/213 gate result; the fresh post-patch 217/217 run and full Harness check superseded that result before later test additions.

## Current Count Policy

| Bucket | Approximate scope | Meaning |
| --- | ---: | --- |
| Confirmed | 85-95 | Covered by current gate, focused test, runtime API, smoke, or browser evidence. |
| Partial | 25-35 | Implemented or documented in part, but still needs product decision, richer browser proof, or direct contract coverage. |
| Blocked | 3-8 | No current EPERM/browser gate blocker remains; remaining blocked items are product-scope decisions or public-launch dependencies. |
| Future | 60+ | Public-launch operations and richer product requirements that are still planned, not complete. |

## Module Ledger

| Module | Status | Current evidence | Remaining work |
| --- | --- | --- | --- |
| Harness and gates | Confirmed baseline, refresh required | Post-patch `npm run test` passed 217/217; lint passed; memory eval passed with `recallAt5=1`/`MRR=1`; production-depth passed 10/10; smoke passed with 748 generated assets and 52 market offers; `npm run harness:check` ended with `harness check ok`. Later release-gate-flow, knowledge-context, frontend turn-focus, and guide workers reported focused gates passing after adding tests. | Rerun staged `npm run test`, `npm run lint`, and `npm run harness:check` after all workers settle to establish current totals. |
| Market economy contract | Partial | Restarted runtime API verified buy/sell as `turnCost=free-time`, stock deltas, unchanged round/active player, wallet changes, and static GET `/market` stock. | Product rule, localized copy review, browser-flow evidence, and regression coverage still open. |
| Frontend UX and setup | Partial, no P1 blocker in latest browser pass | `syncSetupGuidance is not defined` was fixed; static UI focused tests passed 12/12; no-local-player setup now remains visible when no complete local binding is present in an already-started room. Latest desktop and 390px browser regressions passed with `issues=[]` and `noLocalHasJoinPath=true`, including `/private/tmp/aidm-visual-qa-20260525/main-after-binding-ux/regression-report.json`. | First-time setup hierarchy, confirmation feedback, and some localization polish remain open product work. |
| `#marketStatus` CSS | Confirmed | CSS fix landed; `node --test tests/noScrollUi.test.js tests/staticUiStructure.test.js` passed 2/2; `node --check public/app.js public/i18n.js` passed; latest browser regression did not report clipping/overflow. | Recheck after future market copy or layout changes. |
| Static serving and browser regression | Confirmed current | Static/API preflight returned 200 for `/`, `/app.js`, `/styles.css`, `/i18n.js`, and `/api/health`; latest full browser regression reports passed with `issues=[]`, `brokenImages=[]`, `maxOverflowX=0`, and no console errors. | Keep screenshot proof attached to the QA records; rerun after future UI/static changes. |
| Asset reuse | Partial | Fresh smoke baseline remains `generatedAssetCount=748`; the current market exposes 52 offers. Assets are manifest-managed and reused across runtime surfaces. | Asset expansion remains below 3000 generated rasters and 500 player-safe scene backdrops; do not continue image expansion in this pass. |
| Docs/Harness | Confirmed current | Docs now record the 217/217 baseline as historical post-patch evidence, later focused gate additions, static/API recovery, full browser regression, and open BUG-0004 through BUG-0006. | Keep stale blocked notes as history but anchor current status in this ledger, tasks, BUGS, ROADMAP, and current QA handoff. |
| Public launch | Future | Roadmap keeps launch-readiness scope visible. | Auth, production DB, backups, privacy deletion, safety service, rate limits, load tests, deployment runbook, and ops remain future. |

## Confirmed This Round

- Release-gate baseline facts are green at the post-patch 217/217 handoff baseline, with later focused gate additions reported green.
- Runtime API free-time contract passed after stale server reset.
- `#marketStatus` CSS fix is code/test confirmed.
- Browser runtime bug `syncSetupGuidance is not defined` was fixed and covered by focused UI checks.
- macOS/OS sandbox permission was restored by user authorization, and Docs/Harness files were readable during this pass.
- Euler/Sartre test patches landed, and the 217/217 post-patch gate superseded the previous 213/213 baseline before later test additions.
- Static/API serving is stable on the current server.
- Complete desktop and mobile browser regression passed after the no-local-player setup fix.

## Still Pending

- BUG-0004, BUG-0005, and BUG-0006 stay open.
- Asset counts should stay at the current manifest/smoke baseline unless fresh manifest-backed evidence changes them.
- Market free-time rule documentation, purchase/use feedback, tool-like item semantics, soundscape status placement, and setup/action hierarchy polish remain open product work.

## Next 10 Work Items

1. Decide and document the market free-time rule and localized player-facing copy.
2. Improve purchase/use confirmation and backpack-added feedback.
3. Clarify tool-like item equip, use, and non-equippable semantics.
4. Surface active soundscape/audio status outside Settings.
5. Continue first-time setup localization and action hierarchy polish.
6. Recheck mobile layout, drawer focus, audio fallback, dice/log surfaces, and inventory detail after the next UI change.
7. Keep asset reuse manifest-backed and avoid raw gallery exposure.
8. Keep generated asset ledger and inventory docs synchronized with manifest-backed counts.
9. Continue 200-requirement coverage from the current green baseline without claiming public-launch readiness.
10. Keep BUG-0004 through BUG-0006 open until their close conditions have direct evidence.
