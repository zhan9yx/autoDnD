# 0012 Permission Recovery Handoff

Status: permission recovery recorded; post-patch release gates and browser recovery are now verified.

## Scope

- This document records Docs/Harness coordination facts and the later verification evidence.
- No generated assets were added by this documentation pass.

## Recovery Facts

- The macOS/OS sandbox EPERM blocker was cleared by user authorization.
- Docs/Harness files were readable during this pass after the earlier `Operation not permitted` and `uv_cwd` failures.
- The earlier permission incident remains relevant history because it interrupted static/browser evidence collection.

## Patch Status

- Euler test patches have landed.
- Sartre test patches have landed.
- Because those patches landed after the recorded 213/213 baseline, the earlier 213/213 result is historical only.
- The post-patch gate baseline is `npm run test` 217/217 and full `npm run harness:check` green. Later workers added release-gate-flow, knowledge-context, frontend turn-focus, and guide coverage, so the final staged full-suite run must establish the current total.

## Verification Completed

- Static/API serving after permission recovery:
  - `/`
  - `/app.js`
  - `/i18n.js`
  - `/styles.css`
  - `/api/health`
- Latest checks returned stable 200 responses for the app shell, static assets, and health endpoint.
- Complete browser regression replaced the partial Aquinas report:
  - `/private/tmp/aidm-visual-qa-20260524/aquinas-postfix-20260525-003624/regression-report.json`
  - `/private/tmp/aidm-visual-qa-20260525/aquinas-postfix-nolocal-20260525-004000/regression-report.json`
- Both latest browser reports passed with `issues=[]`; the no-local-token desktop and mobile screenshots have visible join paths.
- Full post-patch release gates passed at the baseline:
  - `npm run test`: 217/217
  - `npm run lint`: passed
  - `npm run eval:production-depth`: 10/10, `passed=true`
  - `npm run eval:memory:16h -- --no-report`: `recallAt5=1`, `meanReciprocalRank=1`
  - `npm run smoke`: passed with `generatedAssetCount=748` and `marketOffers=52`
  - `npm run harness:check`: `harness check ok`

## Gate Commands To Refresh

```sh
npm run test
npm run lint
npm run eval:production-depth
npm run eval:memory:16h -- --no-report
npm run smoke
npm run harness:check
```

## Do Not Claim Yet

- Do not close BUG-0004 through BUG-0006.
- Do not update generated asset counts without fresh manifest or smoke evidence.
- Do not claim the 3000+ generated asset or 500-scene target is complete.
