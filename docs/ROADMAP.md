# AIDM Roadmap

## Current Verdict

AIDM is not yet ready for public users. The previous MVP proves the core loop, but a production-quality AI tabletop host still needs five major productization stages: Harness closure, character/rules depth, combat/story intelligence, mature UX/assets, and public-launch operations.

## 0002 Productization Snapshot

Implemented in this iteration:

- V1/V2/V3 foundations: Harness gate, 100-requirement roadmap, 8 species, 8 classes, point-buy attributes, derived stats, deterministic equipment/spells, enemy entities, encounter generation, NPC strategy, combat exchange, director clocks, status effects, replay, and AI proposal validation.
- V4 foundations: richer table UI, chat/action separation, desktop/mobile visual QA, reusable asset pipeline, and 82 checked-in generated SVG assets across scenes, species, classes, weapons, spells, items, NPCs, and enemies.
- Evaluation: default long-memory gate upgraded to 500 events / 50 queries with `recallAt5 >= 0.90` and `MRR >= 0.75`.
- Safety boundary: local host/player tokens, stale room version rejection, and redacted auth fields in public room snapshots.
- Regression: Harness now runs a five-player simulated campaign that covers turn order, memory, combat logs, replay highlights, and token-protected actions.

Still not complete enough to claim public launch:

- No production account system, payment, hosted database, backup/restore, content safety service, privacy deletion flow, rate limiting, load test, or production deployment runbook.
- Asset counts are materially improved but still below the V4 final target for scenes, character portraits, icons, and enemy tokens.
- AI proposal validation exists at the rules boundary, but full model JSON output and moderation are not yet wired as the only narration path.

## 0012 Continuous-Depth Guardrail

The 0012 QA/Harness pass records the current maturity boundary and makes regression gates explicit so AIDM cannot slide back into a thin MVP after v11 production-depth work. The current 0012 working tree also includes reviewable asset expansion and gate evidence from other workers, but it does not complete the long-term 3000/500 asset-scale goal.

Required gate domains:

- Assets: generated image assets stay manifest-managed, player-safe, provenance-backed, and bound to runtime scenes or gameplay surfaces instead of raw galleries.
- Logs: AI DM, state, rules, memory, combat, asset, soundscape, and economy logs stay structured, redacted, and queryable.
- Audio: soundscape and TTS stay deterministic, local-safe, opt-in where needed, and scene-aligned.
- UI: the player table stays one-screen first with localized character, state, market, backpack, and settings flows in drawers or modals.
- Economy: item catalog, market, wallet, stock, buy/sell/use/equip, sale value, and currency-label invariants stay server-authoritative.
- Evaluation: `npm run test`, `npm run lint`, `npm run eval:memory`, `npm run eval:production-depth`, `npm run smoke`, `npm run simulate:campaign`, and `npm run harness:check` remain the release gate set.

Current asset baseline for this review:

- `assets/generated/manifest.json` records 34 generated sheets, 748 generated raster assets, 475 player-safe assets, and 132 player-safe scene backdrops.
- The remaining long-term gap is 2252 generated raster assets and 368 player-safe scene backdrops.
- This expansion is reviewable as a batch, but the project must not claim the 3000+ generated asset or 500-scene target is complete.

Current gate status for this review:

- The previously blocking merge-green gates are now fixed in the current working tree.
- The last mainline post-patch full-suite baseline recorded here was `npm run test` 217/217. Later workers added or updated release-gate-flow, knowledge-context, frontend turn-focus, and guide tests, so the current canonical total must come from the final staged full-suite rerun.
- `npm run lint` was green at the post-patch baseline. Later workers reported higher JavaScript file counts after adding tests; the final staged lint rerun is the canonical count.
- `npm run eval:production-depth` is green at 10/10 with `passed=true`.
- `npm run eval:memory:16h -- --no-report` is green with 16 session blocks, 2,112 indexed events, 256 queries, `recallAt5=1`, and `MRR=1`.
- `npm run smoke` first failed under sandbox localhost restrictions with `EPERM`, then passed after escalation. The latest passing smoke result returned `generatedAssetCount=748`, `marketOffers=52`, `language=zh`, `soundscape=market-city`, `combatLog=1-2`, and `replayHighlights=4`.
- `npm run harness:check` is green after localhost escalation and with the 4173 dev server running. That baseline run included `npm run test` 217/217, memory eval passed, production-depth 10/10 passed, smoke passed, campaign simulation passed, and `harness check ok`.
- Browser QA found and another worker fixed `syncSetupGuidance is not defined`; follow-up static UI focused tests passed 12/12.
- Later release-gate-flow, knowledge-context, frontend turn-focus, and B9 guide workers reported their focused gates passing; these extend coverage but still need the final staged full-suite/Harness run before merge.
- Restarted runtime API verification confirms market buy/sell are free-time operations: `turnCost=free-time`, stock deltas are present, round and active player do not change, wallet changes, and GET `/market` stock remains static.
- The `#marketStatus` long free-time copy clipping issue is fixed by code/static checks: `node --test tests/noScrollUi.test.js tests/staticUiStructure.test.js` passed 2/2, and `node --check public/app.js public/i18n.js` passed.
- A transient Harness attempt during concurrent test edits failed at 208/210, and a later non-elevated run hit localhost `EPERM`; those results are superseded by the later direct 217/217 baseline test run and green Harness baseline.
- Later third-round coordination records that the macOS/OS sandbox EPERM blocker was cleared by user authorization. Euler and Sartre test patches landed after the 213/213 baseline, and the 217/217 post-patch baseline superseded that earlier count before later test additions.
- Static/API serving was reverified after permission recovery: `/`, `/app.js`, `/styles.css`, `/i18n.js`, and `/api/health` returned 200.
- Full desktop and 390px mobile browser regression passed after the no-local-player setup fix with `issues=[]`, `brokenImages=[]`, `maxOverflowX=0`, and visible join paths for no-local-token rooms.
- The follow-up browser regression after the binding-aware setup/market/memo/inventory feedback patch also passed with `issues=[]`.

Open continuation items:

- Market action turn-cost remains a product decision follow-up for final documentation, localized copy review, and browser-flow evidence; the current runtime contract confirms buy/sell are free-time operations.
- Purchase/use feedback should become more explicit than transcript and wallet deltas alone.
- Tool-like item semantics need clear equip, use, or non-equippable copy.
- Active soundscape/audio status should be easier to inspect outside Settings.
- First-time setup localization and top-level action hierarchy still need polish.
- Browser screenshot regression evidence is current for this tree; rerun after the next runtime UI/static change.
- Asset expansion continues from 748 / 3000 generated raster assets and 132 / 500 player-safe scene backdrops toward the documented 3000+ generated asset and 500-scene targets.

## 0012 Product Requirement Expansion

The first product/requirements pass on 2026-05-25 extended `docs/REQUIREMENTS_200.md` from 200 to 260 acceptance-ready requirements without changing runtime code. The new rows are scoped as backlog and acceptance criteria for future implementation workers, with emphasis on complete game-loop QA and the user-reported gaps that still make the table feel less immersive than a mature AI DM.

Coverage added in `REQ-201` through `REQ-260`:

- Product and user-testing workflow: coverage ledger, product subagent triage, user-testing synthesis, and browser screenshot cadence.
- Closed-loop play: room to join, character setup, scene start, action, scene transition, reward, replay, recovery, and mobile or desktop evidence.
- Scene depth: explicit transition commands, discoverable exits, timeline handback, starter campaign scenes, travel, downtime, dialogue scenes, combat-to-exploration handoff, and quest summaries.
- Environment systems: weather state, seasonal calendar, weather mechanics, weather UI consistency, seasonal encounter variants, and asset reuse through overlays before generating more images.
- Audio and voice: dynamic ambience matrix, active soundscape status outside Settings, multiple voice profiles, speaker or active-turn voice cues, and browser voice fallback handling.
- Character and turn UX: richer backstory guidance, party relationship hooks, character switching, active player spotlight, nonlinear turn guidance, intent suggestions, and action consequence preview.
- Inventory and economy: inventory onboarding, item type semantics, equip impact preview, transaction confirmation, and backpack-flow browser QA.
- Event and AI systems: host event dashboard, clock visual map, interruptions, AI randomness seed controls, safety bounds, and proposal variety evaluation.
- Knowledge base and legal boundary: source registry, SRD ingestion boundary, attribution surface, IP guardrail, and retrieval evaluation for rules knowledge.
- Documentation: beginner tutorial expansion, step-by-step player manual, host guidebook, and player recovery manual.

Knowledge-source boundary for future AI DM retrieval work:

- Official source reviewed: D&D Beyond System Reference Document page at `https://www.dndbeyond.com/srd`, current page text reviewed on 2026-05-25.
- The page identifies SRD 5.2.1 as Creative Commons rules content for creator use, with the English SRD v5.2.1 PDF published on 2025-05-01.
- The same page states SRD 5.1 and SRD 5.2 are available under Creative Commons CC-BY-4.0, while protected D&D brand identity and omitted setting or monster terms must not be treated as generally reusable product content.
- AIDM should ingest SRD material only through a source registry with version, license, attribution, allowed-use scope, and excluded protected identity terms before retrieval is wired into AI DM behavior.

## 0012 Product Gap Landing Batch B

The second product-gap pass extends `docs/REQUIREMENTS_200.md` from 260 to 280 acceptance-ready requirements while staying out of runtime and public UI files. This batch is deliberately shaped for low-conflict handoff: it documents narrower, testable slices that implementation workers can pick up independently.

Coverage added in `REQ-261` through `REQ-280`:

- Environment audio: layered ambience mixer, transition cues, accessibility controls, visible status, and deterministic fallback reasons.
- Character logic: switch integrity, companion control policy, active actor ownership validation, and stronger in-turn intent coaching.
- Inventory and economy: reason labels for enabled or disabled actions, quest item flags, and safe handling for clue or protected items.
- Event management: resolution journal, deterministic trigger fixtures, patrols, traps, faction moves, weather shifts, and countdown outcomes.
- AI DM randomness: named scenario seeds, variance telemetry, rejected alternative counts, and validator or fallback traces.
- SRD style knowledge: compact original-language rules briefs, citation QA, source id review, and no long copied rules text in player narration.
- Onboarding and manuals: starter archetypes and a guided first-round script covering chat, action, item use, checks, and scene movement.
- Weather and scene proof: season or weather scene matrix plus replay evidence that transitions remain understandable later.
- Real voice variety: voice profile registry and browser QA for empty, delayed, limited, muted, and active-actor voice states.

Current status for this batch:

- Completed now: backlog requirements, roadmap traceability, QA evidence, and focused requirement or maturity tests.
- Runtime follow-up required: actual ambience layer mixer, profile registry, companion policy enforcement, event trigger fixtures, knowledge brief builder, first-round script surface, and browser voice QA automation.
- Testability now: `tests/requirements.test.js` validates at least 280 stable rows, `REQ-261` through `REQ-280`, topic coverage, and the batch QA document.

## 0013 Public Productization Requirements

The 0013 REQ-400 pass extends `docs/REQUIREMENTS_200.md` from 280 to 400 acceptance-ready requirements. These rows are product capabilities and engineering requirements, not a bugfix count and not a micro patch ledger. The current 0013 branch also includes partial runtime implementation from sibling workers for UI density, scene/audio variety, spell and warrior depth, local auth/session, and room password or approval flows. That partial implementation does not mean all `REQ-281` through `REQ-400` are complete, and it does not approve public beta readiness.

Coverage added in `REQ-281` through `REQ-400`:

- UI density: dense table mode, compact control bar, responsive density preferences, critical state pinning, drawer governance, mobile panel switching, table objective strip, and keyboard or focus support.
- Party and log layout: party or log split layout, structured channels, search and filters, event thread grouping, roll cards, party resource board, visibility boundaries, long-log performance, turn history, recaps, and exports.
- Scene visual dynamics: layered scene mood, animated weather overlays, time-of-day variants, focus transitions, NPC staging, hazard markers, parallax, combat zones, clue highlights, lighting, preloading, reduced motion, snapshots, and visual direction sheets.
- Audio naturalness and weather layers: ambience curves, weather audio engine, acoustics, crowd or creature layers, danger ramps, TTS prosody, NPC voice continuity, ducking, intentional silence, accessibility, latency, debug, interruption policy, and compatibility QA.
- Spells: spell taxonomy, targeting, area templates, concentration, rituals, components, interrupts, scaling, preparation, learning rewards, utility outcomes, healing, summoning, visual assets, log cards, and balance evaluation.
- Warrior specializations: specialization framework, Guardian, Duelist, Vanguard, weapon mastery, stances, maneuvers, taunts, shield intercepts, cleave, rally support, armor progression, encounter balance, and respec policy.
- Auth and sessions: auth provider boundary, email or password auth, social login boundary, refresh rotation, device sessions, room ownership, guest upgrade, revocation, auth audit, minimal profiles, device merge, and recovery rate limits.
- Room password, approval, and create-room hardening: password policy, invite expiry, host approval lobby, join queue, creation abuse guard, template validation, capacity enforcement, private-room discovery, denial copy, role approval, host transfer, and idempotency.
- Deployment and readiness: production configuration, staging parity, artifact provenance, readiness health, migration dry runs, rollback smoke, secrets validation, static asset integrity, observability, canary rate limits, evidence index, beta drill, feedback triage, and public productization gate.

Current status for this batch:

- Completed now: requirement ledger expansion, roadmap traceability, scoped 0013 spec/review/tasks/test-report, QA record, and focused tests for the documentation contract.
- Partially implemented now: collapsible situation controls, compact party/log surfaces, lightweight scene dynamics, local weather/social ambience layers, expanded spell and warrior data, local auth/session paths, and room password or host-approval API/UI hooks have focused automated evidence.
- Not complete now: full implementation of all `REQ-281` through `REQ-400`, consolidated release-candidate live browser certification, deployment readiness, staging parity, secrets validation, observability, support, legal, load, and launch evidence remain open. Later 0013 evidence includes a protected-room browser recheck, but that does not replace the broader product-depth acceptance pass.
- Harness boundary: 0013 now has the full spec, review, tasks, and test-report document set, but the review only approves backlog continuity, partial runtime evidence boundaries, and documentation/test consistency; it does not approve public readiness.

## 0014 Continuous Product Depth Acceptance

The 0014 pass does not add requirements or assets. It creates the QA and Harness acceptance layer needed after the 0013 implementation batch. The active requirement ledger remains `REQ-001` through `REQ-400`; bugfixes and verification tasks are not counted as additional product requirements.

0014 acceptance coverage:

- Situation page: state strip, objectives, clocks, player binding, scene/media status, and no-overlap behavior at desktop and mobile widths.
- Log and party density: dense/comfortable transcript modes, full log drawer, compact party rail, multiple players, local/active/pending/approved state, and long-log ergonomics.
- Multiplayer and permissions: local account session refresh, open rooms, password rooms, host-approval rooms, room-scoped identity recovery, pending-user blocking, and host approve/reject controls.
- Scene and audio: visible scene changes across stage, state, log, replay, soundscape metadata, ambience controls, mute persistence, and browser autoplay or missing-voice behavior.
- Character, spell, market, and backpack loops: class/spell/specialization surfaces, scroll learning where available, market purchase, item detail, use/equip/sell, wallet/stock/inventory persistence, and state recovery after refresh.
- Flow closure: a clean user can create or join a room, create a character, act, chat, change scene, inspect state/log/replay, use market/backpack, recover after refresh, and continue play.

Current status for this batch:

- Completed now: 0014 Harness package, browser QA plan, acceptance checklist, and documentation boundary updates.
- Not completed now: the 0014 browser run itself, committed browser automation, public deployment, production operations, production identity, database migration, monitoring, content safety, privacy/legal, load, support, and launch decision evidence.
- Harness boundary: 0014 approves acceptance design and documentation sync only. It does not approve public readiness or claim all 400 requirements are implemented.

## Version Plan

| Version | Goal | Release Gate | Verification |
| --- | --- | --- | --- |
| V1 Productization Foundation | Close Harness, roadmap, evaluation, state boundaries, and reusable assets | `npm run harness:check` passes; 100 requirements recorded; long-memory eval reusable | Unit, Harness, memory eval, API smoke |
| V2 Characters And Rules | Playable character creation, equipment, spells, and rule pack depth | Character creation E2E; deterministic rules tested | Unit, integration, browser E2E |
| V3 Combat And Story Intelligence | Enemies, tactics, event clocks, quests, AI proposal validation | Full investigate/combat/resolution loop works | Combat regression, AI eval, multi-session eval |
| V4 Mature Table Experience | Rich UI, asset library, replay, battle reports, mobile polish | Five-player room path is usable and visually coherent | Browser E2E, visual QA, accessibility checks |
| V5 Launch Readiness | Auth, production DB, security, cost controls, observability, deploy runbook | Public deployment checklist passes | Load, security, release smoke |

## 100 Requirements

| ID | Title | Version | Priority | Acceptance | Test |
| --- | --- | --- | --- | --- | --- |
| REQ-001 | Establish formal roadmap | V1 | P0 | `docs/ROADMAP.md` records five versions and 100 requirements | Harness |
| REQ-002 | Close 0002 Harness gate | V1 | P0 | `harness:check` passes after report update | Harness |
| REQ-003 | Standard change template | V1 | P0 | Each change has spec, review, tasks, and test report | Harness |
| REQ-004 | Subagent ledger gate | V1 | P0 | Parallel tasks record owner, scope, status, and close-out | Harness |
| REQ-005 | Long-memory eval CLI | V1 | P0 | CLI accepts dataset/report args and returns failing exit code | AI Eval |
| REQ-006 | Long-memory benchmark expansion | V1 | P0 | Dataset has at least 100 events and 20 queries | AI Eval |
| REQ-007 | Aggregated quality command | V1 | P0 | One command runs lint, unit tests, evals, and Harness checks | Integration |
| REQ-008 | API error format | V1 | P0 | API errors return stable `{ error, code }` payloads | Integration |
| REQ-009 | Environment validation | V1 | P0 | Config status is visible and missing optional keys are clear | Unit |
| REQ-010 | Data model ADR | V1 | P0 | JSON-to-database migration path is documented | Review |
| REQ-011 | Persistence adapter boundary | V1 | P0 | Storage can swap JSON for a DB adapter | Unit |
| REQ-012 | Event sourcing foundation | V1 | P0 | Room state has replayable event records | Unit |
| REQ-013 | Room state version checks | V1 | P0 | Stale actions are rejected with latest state guidance | Integration |
| REQ-014 | Host/player/spectator model | V1 | P0 | API validates role permissions | Unit |
| REQ-015 | Room ownership | V1 | P0 | Only host starts, pauses, ends, or moderates | Integration |
| REQ-016 | Log redaction | V1 | P0 | Secrets never appear in logs or reports | Security |
| REQ-017 | Cost metrics schema | V1 | P1 | Rooms track calls, latency, and approximate usage | Unit |
| REQ-018 | Health endpoint expansion | V1 | P1 | Health reports version, store, and provider status | Integration |
| REQ-019 | Frontend smoke automation | V1 | P0 | Create, join, start, and act path is automated | E2E |
| REQ-020 | Release checklist | V1 | P0 | Main merge requires completed release checklist | Harness |
| REQ-021 | Species catalog | V2 | P0 | At least eight species are selectable | Unit |
| REQ-022 | Class catalog | V2 | P0 | At least eight classes have stat tendencies and kits | Unit |
| REQ-023 | Background system | V2 | P1 | Background affects skills or starting items | Unit |
| REQ-024 | Point-buy attributes | V2 | P0 | Attribute budget cannot be exceeded | Unit/E2E |
| REQ-025 | Derived stats | V2 | P0 | HP, defense, initiative, and skill modifiers derive from build | Unit |
| REQ-026 | Skill proficiency | V2 | P0 | Skill tags affect check modifiers | Unit |
| REQ-027 | Character creation wizard | V2 | P0 | Player can complete guided character setup | E2E |
| REQ-028 | Character locking | V2 | P0 | Core stats lock after session start | Integration |
| REQ-029 | Starting equipment | V2 | P0 | Class/background grants equipment | Unit |
| REQ-030 | Inventory schema | V2 | P0 | Items include quantity, weight, tags, and effects | Unit |
| REQ-031 | Weapon catalog | V2 | P0 | At least 30 weapons include damage dice and traits | Unit |
| REQ-032 | Armor catalog | V2 | P0 | Armor changes defense and penalties | Unit |
| REQ-033 | Spell catalog | V2 | P0 | At least 30 spells define costs and effects | Unit |
| REQ-034 | Spell resources | V2 | P0 | Spell slots, cooldowns, or charges are consumed and restored | Unit |
| REQ-035 | Item effects | V2 | P1 | Potions and scrolls mutate status through rules | Unit |
| REQ-036 | Equipment events | V2 | P0 | Equipment changes enter the event log | Integration |
| REQ-037 | Auditable dice log | V2 | P0 | Every roll stores formula, rolls, total, actor, and source | Unit |
| REQ-038 | Check type expansion | V2 | P0 | Attribute, skill, and opposed checks work | Unit |
| REQ-039 | Rule pack interface | V2 | P1 | `d20-lite` can be extended independently | Unit |
| REQ-040 | Character E2E | V2 | P0 | Two players can create characters and start a room | E2E |
| REQ-041 | Enemy entity model | V3 | P0 | Enemies have HP, defense, skills, actions, and behavior | Unit |
| REQ-042 | Encounter generator | V3 | P0 | Threat level generates deterministic enemy groups | Unit |
| REQ-043 | Initiative system | V3 | P0 | Player/enemy ordering is stable and auditable | Unit |
| REQ-044 | Action economy | V3 | P0 | Action, move, and reaction limits are enforced | Unit |
| REQ-045 | Attack resolution | V3 | P0 | Attacks resolve against defense consistently | Unit |
| REQ-046 | Damage calculation | V3 | P0 | Weapon, spell, critical, and mitigation rules are correct | Unit |
| REQ-047 | Damage types | V3 | P0 | Fire, cold, mental, radiant, and physical types affect outcomes | Unit |
| REQ-048 | Resistances and weaknesses | V3 | P0 | Resistance reduces and weakness increases damage | Unit |
| REQ-049 | Status effects | V3 | P0 | Poisoned, stunned, burning, guarded, and marked have durations | Unit |
| REQ-050 | Healing and rests | V3 | P1 | Short and long rest recovery is deterministic | Unit |
| REQ-051 | NPC strategy engine | V3 | P0 | Enemy decisions consider HP, morale, distance, and targets | Unit/AI Eval |
| REQ-052 | NPC morale | V3 | P1 | Enemies can retreat, surrender, or negotiate | Integration |
| REQ-053 | Event progress clocks | V3 | P0 | Successes/failures advance crisis clocks | Unit |
| REQ-054 | Quest tracker | V3 | P0 | Quests store status, clues, objectives, and blockers | Integration |
| REQ-055 | Scene graph | V3 | P0 | Scene transitions have entry and exit conditions | Unit |
| REQ-056 | AI proposal schema | V3 | P0 | AI returns narration, checks, and event proposals separately | Unit |
| REQ-057 | AI proposal validator | V3 | P0 | Illegal state mutations are rejected | Unit |
| REQ-058 | Memory fact types | V3 | P0 | NPC, item, promise, place, and quest facts are typed | Unit |
| REQ-059 | Scene summary compaction | V3 | P0 | Scene end creates compact summaries | AI Eval |
| REQ-060 | Long-history eval v2 | V3 | P0 | 500 events and 50 queries meet thresholds | AI Eval |
| REQ-061 | Invite links | V4 | P0 | Room URL opens join flow correctly | E2E |
| REQ-062 | Identity recovery | V4 | P0 | Refresh restores player identity | E2E |
| REQ-063 | Conflict UX | V4 | P0 | Stale actions show readable recovery state | E2E |
| REQ-064 | Chat/action separation | V4 | P0 | Casual chat does not advance turns | Integration |
| REQ-065 | Spectator mode | V4 | P1 | Spectators can watch but cannot act | E2E |
| REQ-066 | Host console | V4 | P0 | Host can pause, adjust scene, and tune threat | E2E |
| REQ-067 | Table safety tools | V4 | P1 | Players can pause or flag sensitive content | E2E |
| REQ-068 | Desktop UI maturity | V4 | P0 | Layout has clear navigation, panels, and state hierarchy | Visual QA |
| REQ-069 | Mobile UI maturity | V4 | P0 | Main path is usable at 390px width | Visual QA |
| REQ-070 | New user guidance | V4 | P1 | First-time flow guides room and character setup | E2E |
| REQ-071 | Asset manifest | V4 | P0 | Assets include id, type, tags, license, and path | Unit |
| REQ-072 | Scene asset library | V4 | P0 | At least 20 reusable scene assets exist | Visual QA |
| REQ-073 | Species/class portraits | V4 | P0 | At least 40 character-related assets exist | Visual QA |
| REQ-074 | Weapon/item/spell icons | V4 | P0 | At least 120 icon assets exist | Visual QA |
| REQ-075 | Enemy tokens | V4 | P0 | At least 40 enemy token assets exist | Visual QA |
| REQ-076 | Room asset selection | V4 | P1 | Host can pick scene and NPC art | E2E |
| REQ-077 | Asset generation pipeline | V4 | P1 | Asset generation and manifest update are repeatable | Harness |
| REQ-078 | Lightweight battle map | V4 | P1 | Abstract zones, range, and positioning work | E2E |
| REQ-079 | Replay viewer | V4 | P0 | Session events can be reviewed in order | E2E |
| REQ-080 | Battle report export | V4 | P0 | Session summary can be exported | E2E |
| REQ-081 | Account authentication | V5 | P0 | Users can log in and own rooms | Security/E2E |
| REQ-082 | Production database migration | V5 | P0 | Migrations and rollback scripts exist | Integration |
| REQ-083 | Backup and restore | V5 | P0 | Room state can be restored to a checkpoint | Integration |
| REQ-084 | API rate limits | V5 | P0 | Abuse is throttled | Security |
| REQ-085 | Content safety filtering | V5 | P0 | Inputs and outputs pass safety policy | Security/AI Eval |
| REQ-086 | Privacy and deletion | V5 | P0 | PII can be redacted and deleted | Security |
| REQ-087 | Room cost budgets | V5 | P0 | Rooms degrade or pause AI when over budget | Unit |
| REQ-088 | Model fallback chain | V5 | P0 | Premium model failure falls back to mini/mock | Integration |
| REQ-089 | Prompt caching strategy | V5 | P1 | Repeated context cost is reduced | AI Eval |
| REQ-090 | Load testing | V5 | P0 | 100 rooms and 500 SSE clients have baseline results | Load |
| REQ-091 | Room-card billing abstraction | V5 | P1 | Billing interface exists without real payment coupling | Unit |
| REQ-092 | Admin operations console | V5 | P1 | Staff can inspect rooms, costs, errors, and reports | E2E |
| REQ-093 | Operations runbook | V5 | P0 | Start, stop, rollback, and incident steps are documented | Review |
| REQ-094 | Deployment configuration | V5 | P0 | Environment and deployment steps are reproducible | Integration |
| REQ-095 | Legal/IP statement | V5 | P0 | Product avoids implying official DND/COC affiliation | Review |
| REQ-096 | Product analytics | V5 | P1 | Room funnel and retention events are observable | Integration |
| REQ-097 | User feedback entry | V5 | P1 | Players can submit bug and experience feedback | E2E |
| REQ-098 | Full regression suite | V5 | P0 | Character, combat, memory, replay, and UI flows are covered | Regression |
| REQ-099 | Launch smoke campaign | V5 | P0 | Automated five-player 30-minute simulated campaign passes | E2E/AI Eval |
| REQ-100 | Launch readiness gate | V5 | P0 | All P0 gates pass before public release | Harness |
