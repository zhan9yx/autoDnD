# 0014 Non-Auth Combined Browser Attempt

Date: 2026-05-25
Worker: remaining Harness boundary worker
Scope: non-0013 and non-0015 local UX/browser boundary. This pass intentionally avoided new image assets and did not modify auth, audio, spell-warrior, readiness, or public gate code.

## Remaining Item Scan

Locally closeable candidates:

- `0012-continuous-depth-assets`: one uninterrupted desktop/mobile browser pass remains open.
- `0014-continuous-product-depth`: full fresh-data browser QA and full desktop/mobile visual checklist remain open.

Not locally closeable in this worker:

- `0011-production-depth`: remaining unchecked tasks are generated-asset scale and sheet 020 slicing; this worker was told not to expand image assets.
- `0016-*`: remaining deployment, operations, load, support, legal/privacy, owner, and staging tasks need external environment or named-owner evidence.
- 0014 protected-room wrong/correct password and host-approval loops overlap the 0013 auth/access boundary and were not taken over here.

## Browser Runner Attempt

Runner:

```text
/private/tmp/aidm-0014-combined-browser-run.mjs
```

Final report:

```text
/private/tmp/aidm-0014-combined-browser-qa/report.json
```

Final status: blocked by local Chrome/CDP automation instability before a complete evidence pack was produced.

Observed runner failures while attempting to create a fresh local browser pack:

- Default sandbox could not bind `127.0.0.1`: `listen EPERM`.
- Headless Chrome intermittently failed to open its remote debugging endpoint and emitted Rosetta/x64 Chromium warnings.
- CDP commands intermittently timed out at `Target.createTarget` and `Page.captureScreenshot`.
- Visible form submission through CDP was unreliable, so the runner was narrowed to API-seeded visible UI verification. The final run still failed before a complete desktop/mobile report could be produced.
- One stale-version chat attempt correctly produced the product error `房间版本冲突：期望 8，实际 10`; this was treated as a runner synchronization issue, not a product bug.

## Decision

No product bug is opened from this attempt. The available failure evidence points to local browser automation instability and runner synchronization, not a reproducible player-facing defect.

No Harness task is marked complete from this attempt:

- The 0012 uninterrupted combined desktop/mobile browser pass remains open.
- The 0014 fresh-data browser QA plan remains open.
- The 0014 full desktop/mobile visual checklist remains open.

## Verification Commands

Commands run after the attempt:

```bash
node --check public/app.js
node --check public/i18n.js
node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/bilingualUi.test.js tests/playerUiAccess.test.js
node --test tests/maturity.test.js tests/requirements.test.js tests/publicReadinessGates.test.js
npm run harness:status
```

Results:

- `node --check public/app.js`: passed.
- `node --check public/i18n.js`: passed.
- Focused UI/static/player tests passed: 24/24.
- Maturity/requirements/public-readiness docs tests passed: 18/18.
- `npm run harness:status`: passed. Current counts included `0011-production-depth: 67/69`, `0012-continuous-depth-assets: 43/47`, `0014-continuous-product-depth: 19/23`, `0016-deployment-staging-parity: 12/15`, `0016-gate-evidence-index: 9/11`, `0016-load-support: 7/11`, and `0016-operations-recovery: 13/19`.

## Next Step

Use either the Codex in-app Browser tool or a stable native-arm browser automation environment for the next combined pass. Reuse the 0014 QA plan, keep protected-room/auth work assigned to the 0013 boundary, and only close 0012/0014 browser tasks after a complete desktop/mobile report with screenshots or equivalent machine-readable evidence exists.
