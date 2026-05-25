# 0015 Public-Readiness Gates

## Decision

0015 defines public-readiness gates and automated guardrails. It does not pass the public-readiness gates.

## Gate Checklist

- GATE-001 release evidence index: blocked.
- GATE-002 consolidated browser acceptance: blocked.
- GATE-003 deployment and staging parity: blocked.
- GATE-004 operations and data recovery: blocked.
- GATE-005 security and abuse controls: blocked.
- GATE-006 legal and privacy: blocked.
- GATE-007 load and reliability: blocked with partial local smoke evidence.
- GATE-008 support and launch operations: blocked with partial support-plan evidence.

## Current Evidence

- `docs/qa/0015-release-evidence-index.md` maps current evidence and gaps to each public-readiness gate.
- `docs/qa/0015-browser-automation.md` records committed Node browser-contract coverage. It is not a full visual/device browser acceptance pack.
- `docs/qa/0015-fresh-browser-acceptance.md` records a fresh visible-browser run with create/join/start/action/chat/drawers/market checks passing, preserves the original refresh-recovery failure, and records Worker J's local `?room=<id>` refresh fix/recheck.
- `docs/qa/0015-visual-checklist.md` records Worker B visual evidence for desktop, tablet, `<=430px` mobile, and 375px mobile checks. It does not replace the full consolidated browser acceptance pack.
- `docs/qa/0015-integration-preflight.md` records a point-in-time integration preflight, not a final merge gate.
- `docs/qa/0015-consolidated-browser-gap.md` records why the fixed/rechecked local refresh P1 and indexed visual checklist still do not close `GATE-002`.
- `docs/qa/0016-load-support.md` records Worker F-0016 local load-smoke evidence and support/launch operations planning. It does not close `GATE-007` or `GATE-008`.
- 0014 has a browser QA plan and acceptance checklist, but the consolidated desktop/mobile acceptance pack is still open.
- Existing local automated gates and Harness evidence are useful local-alpha evidence.
- No production deployment, production identity, hosted database, observability, incident response, legal/privacy, load, support, or release-candidate sign-off artifact exists in this change.
- Worker J refresh-recovery evidence exists for the local fresh-browser `?room=<id>` path. This closes the local refresh P1 evidence dependency only; it does not close `GATE-002` until the full consolidated desktop/mobile browser acceptance pack exists.

## Verification Commands

```bash
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
npm run harness:status
npm run lint
git diff --check
git status --short
```

## Non-Overlap With Browser Automation

The initial gate-definition pass intentionally did not execute browser automation. Worker C has since attached committed Node browser-contract coverage in `docs/qa/0015-browser-automation.md`; that evidence only helps `GATE-002` traceability and does not pass deployment, operations, security, legal/privacy, load, or support gates.
