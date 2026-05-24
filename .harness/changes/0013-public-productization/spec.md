# 0013 Public Productization

## Requirement

Extend the product requirements ledger from 280 to at least 400 real, acceptance-ready feature and engineering requirements, then keep the Harness record aligned with the current multi-worker 0013 implementation state. This change is not a bugfix count and not a micro-patch ledger. It records both the `REQ-281` through `REQ-400` backlog expansion and the partial runtime slices delivered by sibling workers, while explicitly rejecting any claim that all 400 requirements or public beta readiness are complete.

## Scope

- Add `REQ-281` through `REQ-400` to `docs/REQUIREMENTS_200.md` using the existing table contract.
- Cover the user-named public-productization domains: situation-page density, party and log layout, scene visual dynamics, audio naturalness and weather layers, spells, warrior specializations, auth and sessions, room password or approval or create-room hardening, and deployment readiness.
- Record the current sibling implementation evidence for collapsible situation controls, compact party/log surfaces, layered scene/audio behavior, expanded spell and warrior data, local auth/session APIs, and room password or host-approval flows.
- Add roadmap traceability for the 0013 backlog expansion and the partial implementation boundary.
- Add requirement review evidence in `.harness/changes/0013-public-productization/review.md`.
- Extend focused tests so the requirement ledger, 0013 documentation, current partial implementation status, and public-readiness boundary stay visible.

## Acceptance Criteria

- `docs/REQUIREMENTS_200.md` contains at least 400 requirement rows.
- Requirement IDs remain unique and sequential from `REQ-001` through `REQ-400`.
- `REQ-281` through `REQ-400` are continuous and individually present.
- The 0013 Harness documents exist: `spec.md`, `review.md`, `tasks.md`, and `test-report.md`.
- 0013 documents distinguish accepted backlog requirements, partial sibling-worker runtime evidence, and remaining unclosed launch gaps.
- 0013 records never count bugfixes as requirements and never claim `REQ-281` through `REQ-400` are fully implemented.
- Roadmap and tests name the 0013 public-productization range and the required coverage domains.
- Focused requirement and maturity tests pass.

## Non-Goals

- Do not claim public beta readiness.
- Do not claim all `REQ-281` through `REQ-400` are fully implemented.
- Do not treat local prototype auth, local browser audio, or partial UI coverage as production deployment evidence.
- Do not change public UI, API, storage, auth, audio, rules, or deployment code in the Worker E documentation consistency pass.

## Follow-Up Boundary

Remaining implementation should split the 120 new requirements into separate UX, visual, audio, rules, security, room-access, browser-QA, and release-readiness Harness changes. Partial runtime evidence from sibling 0013 workers can be linked to specific requirement IDs, but it must not be treated as full public-readiness closure.
