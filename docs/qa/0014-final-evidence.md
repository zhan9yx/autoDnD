# 0014 Final Evidence

Date: 2026-05-25 10:57 CST
Worker: AIDM 0014 parallel worker AA
Scope: final QA evidence collation only. This note does not modify product code, tests, public UI, assets, server code, generated screenshots, or requirement ledgers.

## Status Summary

`npm run harness:status` previously moved `0014-continuous-product-depth` from 18/23 to 19/23 after Faraday/K evidence closed the full Harness-check task. Later worker Z fixed the 375 px mobile P1 issues found by the responsive browser pass and recorded a focused 375 px smoke screenshot. This still does not close additional checklist tasks because the available evidence is not a full fresh-data 0014 browser acceptance run and does not cover the entire acceptance checklist.

Current 0014 task decisions:

| Task | Decision | Evidence |
| --- | --- | --- |
| Run full `npm run harness:check` if localhost sandbox permissions allow it | Closed | `docs/qa/0014-final-gate-observation.md` records default-sandbox localhost `EPERM`, then a localhost-capable `npm run harness:check` pass ending with `harness check ok`. |
| Execute the 0014 browser QA plan on a fresh local data file and attach screenshots or reports | Still open | `docs/qa/0014-mobile-layout-browser.md` used fresh data and screenshots, but it was a responsive-layout pass, not the full `docs/qa/0014-browser-qa-plan.md` flow. Protected-room wrong/correct password and host-approval browser loops, multi-context join, full market use/equip/sell, refresh recovery, and audio persistence remain incomplete. |
| Run desktop and mobile visual checks for the entire acceptance checklist after the next runtime/UI change | Still open | Desktop/current and responsive screenshots exist, and worker Z fixed the known 375 px P1 issues with a focused smoke screenshot, but the full acceptance checklist still has not been rerun across desktop and mobile. |
| Convert recurring browser QA script into committed automated coverage | Still open | The QA plan still contains only an automation skeleton; no committed browser test was added in this documentation pass. |
| Complete deployment, operations, security, legal, load, and support gates before public-readiness claim | Still open | All 0014 readiness docs continue to block public-launch readiness. |

## Evidence Sources Reviewed

- `docs/qa/0014-final-gate-observation.md`: lint, test, Harness status, default-sandbox `EPERM`, and localhost-capable Harness-check pass.
- `docs/qa/0014-test-readiness.md`: focused and full automated gate evidence.
- `docs/qa/0014-integration-risk.md`: JS syntax, lint, targeted Node suites, cross-module risk, and required browser paths.
- `docs/qa/0014-localization-leak-check.md`: Chinese player-surface leak checks, readiness-claim scan, and 32/32 focused localization tests.
- `docs/qa/0014-browser-current.md`: current desktop browser QA and screenshots, including room flow, scene change, drawers, log density, auth/gateway, and access-mode entry points.
- `docs/qa/0014-audio-scene-browser.md`: scene/media/audio drawer browser QA and ambience toggle state.
- `docs/qa/0014-mobile-layout-browser.md`: fresh-data responsive browser screenshots at 375, 430, 768, and 1280 px.
- Worker Z 375 px smoke evidence: `/private/tmp/aidm-0014-worker-z-375.png`; `node --test tests/noScrollUi.test.js tests/staticUiStructure.test.js` and `npm run lint` passed after the fix.
- `docs/qa/0014-browser-regression-after-smallfixes.md`: targeted browser recheck for visible scene meta labels and disabled Market copy/aria after small fixes.
- `docs/qa/0014-final-diff-summary.md`: point-in-time dirty-tree and diff summary, plus browser-readiness caveats.
- `docs/qa/0013-room-auth.md`: protected-room API/static coverage and explicit live-browser gaps.

No separate current files named `0014-fresh-browser`, `0014-default-language`, `0014-protected-room`, or `0014-market-backpack` were present during this AA pass. The related evidence is covered by the files above.

## P0/P1 Closure And Open Blockers

Closed or non-current P0/P1 risks:

- No P0 blocker was found in the current 0014 desktop browser, audio/scene browser, responsive screenshot, or targeted regression evidence.
- Automated gate blockers are closed in current evidence: `npm run lint` passed, `npm run test` passed with 274/274 in K evidence, focused readiness suites passed, and localhost-capable `npm run harness:check` passed.
- The historical `toolUse is not defined` item-catalog blocker is non-current: `docs/qa/0014-integration-risk.md` records `node --check src/core/itemCatalog.js` and ESM import passing with `itemCatalog import ok`.
- Known Chinese player-surface leak classes are covered by focused tests: `docs/qa/0014-localization-leak-check.md` records 32/32 passing and no current live-string hits for the previously documented `Weather matched` / `director beat` leak terms.
- The browser-visible Market insufficient-funds contradiction from `docs/qa/0014-browser-current.md` is closed for the current room data by `docs/qa/0014-browser-regression-after-smallfixes.md`: disabled samples no longer show `可购买` in visible status, button aria, button title, or card aria, and `blockedAvailableLeaks=[]`.
- The 375 px mobile action and state-strip P1 findings from `docs/qa/0014-mobile-layout-browser.md` are closed by worker Z's focused fix: in 375x667 smoke, summary/dense/comfortable log-density modes kept `行动` inside the viewport, body/document scrollHeight stayed at 667, and the collapsed state details had `aria-hidden=true`, `inert`, and `visibility:hidden`.

Open P1 blockers:

- None in the current evidence pack after worker Z's 375 px focused regression.

## P2 And Watch Items Remaining

- Reward toast can cover the lower-right log/action composer after a successful action. It is dismissible and did not block the verified desktop flow, but it still competes with current action controls.
- 768 px topbar clipping was addressed by worker Z with a 681-1120 px grid layout and static/no-scroll coverage, but a fresh 768 px screenshot after that fix is still pending.
- 375 px party rail intentionally scrolls horizontally. Current metrics say it does not create body-level horizontal scroll, but it should stay watched as intentional rail overflow rather than page overflow.
- Audio/scene evidence verified UI state and Web Audio control feedback only. Actual speaker output, audio naturalness, mute persistence after refresh, season-specific visuals, and audible layer quality remain unverified.
- Scene/audio labeling still has polish gaps: earlier audio evidence saw `market-city`/market-city wording around a rainy archive-street scene, while later regression evidence improved visible scene chip labels for the current room.
- Market disabled-state regression covered current `资金不足` examples only. `售罄`, `已拥有`, and `锁定` disabled examples were not forced in the live browser pass.
- Static localization checks still find English fallback/dictionary text in implementation files. Focused tests cover the checked player-visible paths, but live browser first-paint/default-language behavior is not fully proven.

## Public-Readiness Gates Still Not Checkable

Do not mark public-readiness complete from the current 0014 evidence. The following remain outside the completed evidence pack:

- production identity provider, account recovery, abuse/rate-limit, secret rotation, and hardened auth operations;
- production database/persistence, backup, restore, migration, monitoring, alerting, and runbook evidence;
- privacy, legal, safety, support, moderation, and public user handling;
- load/performance evidence for hosted multi-user rooms and SSE;
- deployment/rollback evidence and final launch decision record;
- one consolidated release-candidate browser pack that covers full fresh-data flow, protected rooms, desktop/mobile visual acceptance, and audio behavior together.

## Final Main-Agent Closeout Commands

After the remaining QA workers were closed, the main agent reran:

```bash
git status --short --untracked-files=all
git diff --check
npm run lint
npm run test
npm run harness:status
npm run harness:check
```

Use a localhost-capable runner for `npm run harness:check`; the default sandbox can fail localhost-backed tests with `listen EPERM` even when product assertions are green.

Final main-agent result after the test-expectation sync:

- `npm run lint`: passed, 79 JavaScript files checked.
- `npm run test`: passed, 276/276.
- `npm run harness:status`: passed; 0014 remains 19/23 with full browser/full visual/automation/public-readiness tasks still open.
- `npm run harness:check`: passed after starting the local 4173 dev server; output ended with `harness check ok`.
- `git diff --check` and conflict-marker scan passed.
