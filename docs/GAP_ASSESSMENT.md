# Product Readiness Gap Assessment

## Verdict

AIDM is not ready for public users to start real paid or open internet campaigns. It is now beyond the earliest MVP shape: the current local prototype has Harness discipline, a 400-row requirement ledger, deterministic rules, generated assets, room state, local auth/session paths, password and host-approval rooms, market/backpack flows, audio metadata, replay, and broad automated coverage. The remaining gap is public-product readiness: consolidated browser acceptance, production operations, security hardening, compliance, load, and support evidence.

## P0 Gaps

- No consolidated 0014 browser acceptance run covering the full current product loop across desktop and mobile.
- No production identity provider, session rotation policy, account recovery, abuse throttling, or security review beyond local prototype storage.
- No production database migration, backup, restore, retention, or rollback drill from the local JSON store.
- No deployment readiness pack: staging parity, secrets validation, observability, alerting, incident response, support handoff, and rollback smoke are not closed.
- No content safety, privacy deletion/export, legal/IP, load, canary, or public feedback triage gate.

## P1 Gaps

- Some 0013 product-depth surfaces still need one release-candidate browser pass: situation page density, log density, party rail, multiplayer recovery, scene change, environment audio, spell/class surfaces, market/backpack, login/room permissions, and turn guidance.
- Browser audio compatibility remains device-sensitive and needs evidence for autoplay restrictions, missing or delayed voices, background tabs, mute persistence, and reduced-audio use.
- Character spell/specialization and market/backpack flows have rules/API evidence, but they still need current browser acceptance evidence for first-time players.
- Asset scale is improved but still below the documented commercial-scale target.
- Production AI behavior still needs provider configuration, content safety, prompt/evaluation governance, and operational cost controls before public use.

## P2 Gaps

- No marketplace/module import flow.
- No mobile PWA installation polish.
- No image/video generation job queue.
- No creator tooling for custom campaigns and rule packs.

## Release Standard

AIDM should only be called public-ready after the v5 gates in `docs/ROADMAP.md` pass, including long-history evals, combat regression tests, 0014 browser acceptance evidence, operations checklist, and a real persistence/auth plan.

## Current Player-Flow Residual Risks - 2026-05-24

Context: main thread reported the full harness gate green on the current branch: 165/165 tests, memory eval, production-depth eval, smoke, and simulation all passed. The remaining notes below are browser QA/product risks from a low-context pass on `http://localhost:4185/`.

### P0/P1 Risks

- [P0] Core action controls are partially clipped at 1280x720: the composer measured `bottom=738` in a 720px viewport.
- [P1] Chinese player flow still leaks English/internal terms: native setup options (`Human`, `Warrior`), join role `Investigator`, and scroll-use result `sleep`.
- [P1] Market discoverability is weak because the market is only reached through Settings in this pass.
- [P1] Purchase confirmation is too quiet; wallet/log updates are present, but no focused confirmation or backpack-added cue appears.
- [P1] Market post-purchase state is ambiguous because the bought item remains visible and only reports `克朗不足`, not sold out, owned, or depleted.
- [P1] Item economy labeling is unclear because purchase price and backpack/detail value differ without explanation.
- [P1] Equipment affordance is unclear for tool-like items: an empty `工具` slot is visible, but a starter lantern exposes no equip path.

### P2 Risks

- Ambience label can feel semantically off from the current scene (`市场与城市街道` while viewing a rain-wet archive street).
- Voice profile labels include technical locale tags (`zh-CN`, `zh-TW`) in the player UI.
- Chat, fresh dice resolution, state drawer content, and reload recovery were not reverified in the interrupted `localhost:4185` pass.
