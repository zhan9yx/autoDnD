# Requirement Review

Decision: approved as a backlog, partial-implementation evidence, and documentation-consistency change, with Worker E integration updates. This is not a public-readiness approval.

## Review Summary

0013 now has a complete Harness documentation set and a synchronized record for the current multi-worker state. The review accepts the documentation sync and records partial runtime/API implementation evidence from sibling workers, including Worker H flow-closure automation and Avicenna auth-crypto hardening. It does not claim `REQ-281` through `REQ-400` are fully implemented, does not certify live browser QA, and does not approve deployment or launch readiness.

## Review Findings

- MUST FIX: Browser verification is still incomplete outside the focused slices. Evidence: Worker A and AD recorded live browser evidence for account session restore, password-room entry, approval pending state, host queue controls, and approved-player refresh recovery. Worker H recorded desktop/mobile no-account browser smoke evidence in `docs/qa/0013-no-account-browser.md`. The 0013 public-productization worker added host rejection click-through, foreground audio control, and spell/warrior minimum visible-flow evidence. Consolidated acceptance, background/audio audible behavior, balance feel, and deployment-readiness evidence are still not closed. Suggested action: keep consolidated browser acceptance open until the full device/flow pack exists.
- INFO: Auth and room-access rejection now has first-class browser click-through evidence. Evidence: the 0013 public-productization worker created a host-approval room, submitted a pending `Vale` character, opened the visible host access queue, clicked `Reject`, observed `暂无待审批加入申请。`, and recorded screenshots under `/private/tmp/aidm-0013-public-productization-worker/`.
- MUST FIX: Public-readiness scope remains backlog-only. Evidence: `REQ-387` through `REQ-400` cover staging parity, launch checks, migrations, observability, abuse controls, rollback, support, legal, and evidence indexing; none are closed by this documentation sync. Suggested action: require separate release-readiness implementation and evidence.
- INFO: `REQ-001` through `REQ-400` are continuous in the requirements ledger, and `REQ-281` through `REQ-400` are written as product capabilities or engineering requirements rather than bugfix rows.
- INFO: UI density, audio scene variety, spell expansion, warrior specialization, auth APIs, and room access APIs have focused automated evidence, and the auth/access slice now has local live-browser screenshot evidence. That evidence is still module-scoped and not a full launch gate.
- INFO: Avicenna upgraded local user-password, room-password, and session-token storage to versioned `scrypt` formats with legacy SHA-256 migration coverage. The prior SHA-256 risk is no longer the current documented blocker, but production deployment still needs secret rotation, KDF parameter review, and operational hardening.
- INFO: Current direct full-suite evidence is `npm run test` with 264 tests total, 264 passed, 0 failed, and 0 TODO. AK completed the post-Hilbert escalated `npm run harness:check` rerun with localhost permission, and it ended with `harness check ok`.
- INFO: Default-sandbox Harness still requires localhost permission for server-backed tests; the earlier `listen EPERM` failure is an environment permission issue, not a product assertion failure.
- INFO: Earlier stale blockers have been cleaned up in the documentation: missing `review.md`, `freezeSpellOptions` import failure, and old mage starting-spell expectations are not current Worker E blockers.
- INFO: Worker B added focused automated evidence for starting spell card semantics and visible warrior specialization setup. This is accepted as module-scoped code/test evidence only; it does not close the remaining spell/warrior live-browser flow item.
- INFO: Worker F added `docs/qa/0013-spell-warrior-browser.md` with a minimum spell/warrior evidence pass. The pass confirms static/API-focused starting-spell and warrior-specialization evidence, but live browser tooling did not complete visible room-open/join proof, so the spell/warrior browser-flow item remains open.
- INFO: Worker F added `docs/qa/0013-audio-browser.md` and `tests/audioBrowserCompatibility.test.js` with static/unit browser-audio compatibility contracts for autoplay-safe ambience opt-in, missing Web Audio fallback UI, delayed/missing speech voices, local `speechSynthesis`, and mute/voice preference persistence. This does not close live browser audio compatibility or background-tab behavior.
- INFO: Worker H added `docs/qa/0013-no-account-browser.md` with visible browser evidence for the no-account desktop/mobile flow: open-room creation, guest join, scene start, action submit, My character, State, Full log, Settings, and Market. This closes the no-account smoke checkbox only and does not approve public readiness.
- INFO: The 0013 public-productization worker superseded Worker F's live-browser tooling blocker for the minimum spell/warrior path by using headless Chrome DevTools on `http://127.0.0.1:4223`; it does not claim a full class/device/balance matrix.

## Approved Now

- 0013 Harness and QA documentation synchronization.
- REQ-400 backlog boundary and overclaim guard.
- Recording partial sibling-worker implementation evidence.
- The Worker E documentation and requirement-test consistency pass.
- Recording Worker H automated flow-closure coverage and Avicenna scrypt hardening.
- Recording live-browser and deployment/readiness gaps after post-hardening Harness passed.

## Not Approved Now

- Any claim that `REQ-281` through `REQ-400` are fully implemented.
- Any claim that partial UI/auth/audio/rules work completes public productization.
- Any claim that account auth or access-controlled rooms are complete without first-class browser UI and live browser evidence.
- Any deployment or launch readiness claim.
- Any public-release decision without live browser, deployment, and accepted residual-risk evidence.
