# 0014 Product Depth Acceptance Checklist

Date: 2026-05-25
Worker: 0014 QA/Harness worker F
Scope: acceptance checklist for current product-depth evidence after 0013. This is not a new requirement-count expansion and not a bugfix ledger.

## Status Boundary

Accepted input evidence:

- `docs/REQUIREMENTS_200.md` contains `REQ-001` through `REQ-400`.
- 0013 automated gates reached a green baseline in recorded evidence.
- 0013 protected-room final recheck records visible password-room and host-approval room loops passing in browser.
- 0013 static/API tests cover auth/session, password rooms, host approval, room read authorization, room snapshots, UI density contracts, market, inventory, audio metadata, and rules slices.

Not accepted as public launch evidence:

- Deployment readiness.
- Production identity provider, database, backup, restore, monitoring, abuse, safety, privacy, legal, load, and support evidence.
- A single consolidated release-candidate browser pack across all domains below.

## Checklist

| Domain | Acceptance Target | Current Evidence | 0014 Browser Recheck |
| --- | --- | --- | --- |
| Situation page | State strip, objective, clocks, scene/media status, player binding, and current room state are visible without crowding the main play loop. | Static UI checks and 0013 browser screenshots show density controls and state/log/audio surfaces. | Recheck desktop and mobile widths; expand/collapse state strip; verify no overlap with action composer and drawers. |
| Log density | Dense mode keeps recent entries compact; comfortable mode remains readable; full log drawer keeps complete history. | Static tests cover dense/comfortable controls and full-log wiring. | Generate at least 12 log entries; toggle density; open full log; verify channels and turn-moving entries remain understandable. |
| Party rail | One and multiple players remain visible as compact party cards without vertical growth breaking the stage. | Static tests cover compact party strip sizing. | Join at least three players; verify local, active, pending, and approved states are visually distinct. |
| Multiplayer | Host and multiple players can create, join, refresh, and continue acting with the correct room-scoped identity. | API/static coverage plus 0013 protected-room recheck. | Use at least two browser contexts; refresh host and player tabs; verify no duplicate seat or lost local player binding. |
| Scene changes | Player actions can move the scene; backdrop, scene summary, state drawer, log, soundscape metadata, and replay remain aligned. | Scene/audio tests and 0013 density screenshots cover partial evidence. | Submit a travel or investigation action that changes location or weather; inspect stage, State, Log, and Replay. |
| Environment audio | Ambience controls are opt-in, local, muteable, and resilient to missing voices or autoplay restrictions. | Audio unit tests cover deterministic soundscape and local synthesis metadata. | After user gesture, toggle ambience and voice; change scene/weather; verify mute persistence after refresh and no blocking of gameplay. |
| Spells and classes | Character creation exposes class/spell choices where available; scrolls, known spells, and warrior specialization feedback are understandable. | Rules/catalog/engine tests cover spell definitions, scrolls, and warrior specialization runtime data. | Create mage/bard/envoy/warrior paths as available; buy or inspect scrolls; verify learned spell or specialization state appears in My character. |
| Market and backpack | Buying, selling, using, equipping, wallet deltas, stock changes, item detail, and backpack persistence are clear. | Runtime/API tests cover market/inventory loops; guide records current free-time expectation. | Buy one item, inspect backpack, use/equip/sell when allowed, refresh, and verify server state matches UI. |
| Login and room permissions | Local account session restores after refresh; open, password, and host-approval rooms show valid visible paths and safe errors. | 0013 API/static tests and protected-room final browser recheck. | Register/login, create each room mode, test wrong/correct password, pending approval, host approve/reject, and post-approval refresh. |
| Turn guidance | Active actor, free-time actions, chat/action split, stale action recovery, and pending-player blocking are clear. | Tests cover stale versions, action/chat split, pending-user blocking, and release gate flow. | Submit chat and action separately; verify only action advances turn; try action from non-seated/pending context and verify clear block. |
| Flow closure | A new user can go from room URL to joined character, first action, scene change, market/backpack use, state/log/replay review, refresh, and continued play. | Pieces exist across 0012/0013 docs and tests. | Run one end-to-end script from clean storage and attach evidence before release handoff. |

## Acceptance Rules

- Do not count bugfixes as requirements.
- Do not add requirements beyond `REQ-400` in this pass.
- Do not mark a domain accepted from static tests alone when the checklist asks for live browser behavior.
- Do not use API-assisted setup when a visible user path exists, except to seed isolated test data before visible UI verification.
- Record browser screenshots or machine-readable reports under `/private/tmp` during the run, then link the paths in a QA note; do not commit scratch screenshots unless a later change explicitly owns them.
- Treat public launch as blocked until deployment, operations, security, privacy, legal, load, and support gates are complete.
