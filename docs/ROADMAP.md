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
