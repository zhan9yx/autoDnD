# Stability Long Campaign Regression - 2026-05-26

Worker: AIDM parallel development worker 08

Branch: `codex/table-strip-party-dm-experience`

## Scope

Added a deterministic long campaign simulation for state-size and refresh recovery coverage. The run stresses:

- 6 players across 11 rounds.
- 247 generated transcript events, with the runtime retaining the latest 200-event transcript window.
- 4 active quest threads.
- 6 seeded NPC continuity facts plus 71 retained memories after campaign actions.
- Inventory mutations across buy, use, sell, and reusable tool paths.
- Structured transcript log rendering payload size.
- Disk-backed room refresh recovery through a new `JsonRoomStore` instance.

## Validation Snapshot

Command:

```sh
node scripts/simulate-long-campaign.mjs --turns 72
```

Observed result:

- `ok`: `true`
- `generatedTranscriptEvents`: `247`
- `retainedTranscriptEvents`: `200`
- `players`: `6`
- `rounds`: `11`
- `quests`: `4`
- `memories`: `71`
- `inventoryEvents`: `8`
- `replayHighlights`: `8`
- `recoveredReplayHighlights`: `8`
- `snapshotBytes`: `1603117`
- `stateSummaryBytes`: `33160`
- `logPayloadBytes`: `437255`
- `maxSingleLogBytes`: `5581`
- `structuredLogCount`: `200`
- `logTypes`: `ai.decision`, `asset.selection`, `chat.message`, `dice.roll`, `inventory.mutation`, `state.transition`, `transcript.combat`, `transcript.player`

Memory retrieval checks passed for:

- `NPC-VEY-LEDGER`
- `NPC-ORRA-MOON-KEY`
- `NPC-NALIA-CISTERN`
- `NPC-SELA-WARRANT`

## Automated Test

Command:

```sh
node --test tests/longCampaignStability.test.js
```

Result:

- Pass: `1`
- Fail: `0`
- Duration: about `5.7s`

The test asserts the same invariants as the CLI runner, including transcript volume, retained transcript window, multi-quest state, memory retrieval, structured log presence, payload bounds, replay recovery, and disk refresh recovery.

## Broader Local Run

Commands:

```sh
node --check scripts/simulate-long-campaign.mjs
npm run lint
npm run test
```

Results:

- `node --check scripts/simulate-long-campaign.mjs`: pass.
- `npm run lint`: pass, `101 JavaScript files checked`.
- `npm run test`: red, `354` pass / `2` fail / `1` skipped out of `357`.

The new long campaign test passed inside the full run. The two red tests were outside this worker's touched files:

- `tests/levelingUi.test.js`: `character and log drawer render paths stay non-empty for transcript and progression detail`.
- `tests/memory.test.js`: `structured campaign context retrieves quest, npc, clue, and scene facts after a long transcript`.

Follow-up reruns:

- `node --test tests/levelingUi.test.js`: still red on the same render-path regex.
- `node --test tests/memory.test.js`: pass, `5` pass / `0` fail.

## Notes

- No product code changes were required.
- The simulation uses a local deterministic AI provider path by constructing `AIProvider({})`, so it does not call OpenAI even if a developer shell has `OPENAI_API_KEY`.
- The snapshot intentionally validates that public room snapshots do not expose `auth`.
- The retained transcript cap remains `200` by current product design; the tracking store records total generated event IDs to verify the larger campaign path without changing runtime retention behavior.
