# Table Party DM Experience Commit Plan - 2026-05-26

Worker scope: release coordination only. This pass did not edit product code,
did not stage files, and did not commit. The only intended write is this plan.

## Current Baseline

- Branch: `codex/table-strip-party-dm-experience`.
- Dirty worktree before this plan: 30 ordinary dirty paths.
- Dirty worktree after this plan and the parallel visual-review file appeared:
  32 ordinary dirty paths.
- Staged files: none; `git diff --cached --name-only` returned no paths.
- Tracked diff: 23 modified files, `2168` insertions and `259` deletions.
- Untracked release files: `.harness/changes/0021-mvp-to-rich-campaign-experience/`,
  four existing `docs/qa/*2026-05-26.md` evidence files, this plan, one
  structured memory eval fixture, one long campaign simulation script, and one
  long campaign test.
- Ignored generated payload: `assets/generated/` is about `669M`; Git reports
  `1635` ignored/untracked generated files there. A raw filesystem count sees
  `2384` files under the directory.

## Verification Snapshot

Commands run in this coordination pass:

```sh
git diff --check
node --test tests/levelingUi.test.js
node --test tests/memory.test.js
node --test tests/longCampaignStability.test.js
npm run lint
npm run test
npm run harness:status
```

Current results:

- `git diff --check`: pass.
- `tests/levelingUi.test.js`: pass, 3/3.
- `tests/memory.test.js`: pass, 5/5.
- `tests/longCampaignStability.test.js`: pass, 1/1.
- `npm run lint`: pass, `101 JavaScript files checked`.
- `npm run test`: pass, `357` pass / `0` fail / `1` skipped out of `358`.
- `npm run harness:status`: reports 26 Harness changes; `0021-mvp-to-rich-campaign-experience`
  is `35/37` tasks complete, with remaining items treated as future implementation
  boundary rather than docs-only package failure.

Current known automated failures: none reproduced after the rerun above.

Current known browser visual blockers:

- P0: mobile `375x667` action area overlaps the recent log; recorded in
  `docs/qa/table-party-visual-review-2026-05-26.md`.
- P1: desktop `1280x720` action/log overlap; recorded in the same visual review.
- P1: mobile expanded `table-state-strip` details lose value text because the
  `strong` values measure `height=0`; on `375x667`, expanded details also push
  the action form below the viewport.

Historical note: `docs/qa/stability-long-campaign-2026-05-26.md` recorded an
earlier full `npm run test` red on `tests/levelingUi.test.js` plus a transient
`tests/memory.test.js` failure. Both targeted suites are green now, and the full
test suite is green now.

Not yet repeated in this coordination pass:

- Full `npm run harness:check`.
- Fresh live browser visual pass after the UI blockers above are fixed. Existing
  browser evidence is recorded in `docs/qa/table-state-strip-collapse-2026-05-26.md`,
  `docs/qa/log-density-2026-05-26.md`, and
  `docs/qa/table-party-visual-review-2026-05-26.md`.

## Suggested Commit Order

1. `docs: add 0021 rich campaign backlog package`
2. `feat: add structured campaign memory context`
3. `feat: harden AI DM storyteller narration`
4. `test: add long campaign stability regression`
5. Fix and revalidate the blocked UI batch, then commit
   `feat: tighten table party, log, and action controls`
6. `docs: record table party DM release evidence`

If reviewers do not want hunk staging, combine batches 2 and 3 into one product
commit. `src/core/gameEngine.js` and `tests/gameEngine.test.js` bridge structured
memory retrieval, AI isolation, and storyteller integration, so whole-file
staging makes those two batches overlap.

## Batch 1 - 0021 Requirements Package

Category: `0021` requirement package.

Files:

- `.harness/changes/0021-mvp-to-rich-campaign-experience/spec.md`
- `.harness/changes/0021-mvp-to-rich-campaign-experience/requirements.md`
- `.harness/changes/0021-mvp-to-rich-campaign-experience/tasks.md`
- `.harness/changes/0021-mvp-to-rich-campaign-experience/review.md`
- `.harness/changes/0021-mvp-to-rich-campaign-experience/test-report.md`

Pre-commit tests:

```sh
git diff --check -- .harness/changes/0021-mvp-to-rich-campaign-experience
npm run harness:status
```

Known failures / caveats:

- No current docs-only failure.
- Do not claim `REQ-401` through `REQ-900` are implemented.
- `harness:status` keeps future implementation-boundary items open.

Do not include:

- Runtime, UI, test, generated asset, or QA evidence files from the other
  batches.

## Batch 2 - Structured Campaign Memory

Category: structured campaign memory.

Files:

- `docs/ARCHITECTURE.md`
- `docs/EVALUATION.md`
- `scripts/evaluate-memory.mjs`
- `evals/long-memory/campaign-structured-memory.json`
- `src/core/memory.js`
- `src/core/stateMachine.js`
- `src/core/stateSummary.js`
- `src/core/gameEngine.js`
- `tests/evaluation.test.js`
- `tests/gameEngine.test.js`
- `tests/memory.test.js`

Scope:

- Adds campaign memory layers for timeline, quest, NPC, clue, and scene entries.
- Adds structured retrieval diagnostics, layer recall scoring, and state summary
  memory surface counts.
- Wires deterministic server-authored memory writes after action resolution.
- Keeps AI as a consumer of retrieved context, not a direct memory writer.

Pre-commit tests:

```sh
node --check scripts/evaluate-memory.mjs
node --test tests/memory.test.js tests/evaluation.test.js tests/gameEngine.test.js
node scripts/evaluate-memory.mjs evals/long-memory/campaign-structured-memory.json --no-report
```

Known failures / caveats:

- None current after rerun.
- If this batch is staged without the AI storyteller batch, use `git add -p` for
  `src/core/gameEngine.js` and `tests/gameEngine.test.js`, or combine the two
  batches.

## Batch 3 - AI DM Storyteller

Category: AI DM storyteller.

Files:

- `src/core/aiProvider.js`
- `src/core/localization.js`
- `src/core/gameEngine.js` if not already included in batch 2
- `tests/knowledgeContextQa.test.js`
- `tests/localization.test.js`
- `tests/gameEngine.test.js` if not already included in batch 2

Scope:

- Adds required storyteller structure: scene beat, sensory detail, consequence,
  and optional next-action references.
- Locks narration language and falls back to deterministic local narration when
  provider output mismatches room language.
- Keeps AI output from mutating HP, inventory, dice, turn order, status, or
  campaign memory directly.

Pre-commit tests:

```sh
node --test tests/knowledgeContextQa.test.js tests/localization.test.js tests/gameEngine.test.js
npm run lint
```

Known failures / caveats:

- None current.
- This batch depends on the memory API shape from batch 2 if staged separately.

## Batch 4 - UI Collapse, Party Rail, Logs, Action Tracker

Category: UI collapse / party rail / logs / action tracker.

Files:

- `public/index.html`
- `public/app.js`
- `public/i18n.js`
- `public/styles.css`
- `tests/bilingualUi.test.js`
- `tests/browserAutomation.test.js`
- `tests/levelingUi.test.js`
- `tests/noScrollUi.test.js`
- `tests/staticUiStructure.test.js`
- `docs/qa/table-state-strip-collapse-2026-05-26.md`
- `docs/qa/log-density-2026-05-26.md`
- `docs/qa/table-party-visual-review-2026-05-26.md`

Scope:

- Keeps expanded `table-state-strip` in normal layout flow instead of overlaying
  the party rail or stage.
- Enlarges and stabilizes party cards, active/round tags, vitals, and crowded
  rail sizing.
- Adds scene danger/clue tracker labels and thresholds.
- Adds full log drawer search, type filter, key-event filter, latest jump,
  visible count, and collapsed long-text detail rows.
- Adds action/chat intent segmented controls for the action form.

Pre-commit tests:

```sh
node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js
node --test tests/browserAutomation.test.js tests/bilingualUi.test.js tests/levelingUi.test.js
npm run test:browser-qa
```

Recommended browser evidence before committing this batch:

```sh
PORT=4209 AIDM_DATA_FILE=/private/tmp/aidm-table-state-strip-store.json npm run dev
```

Then verify desktop and mobile that expanded state details do not overlap party
or stage, the log drawer filters behave, and action intent tabs remain reachable.

Known failures / caveats:

- Automated tests are green, but this batch is visually blocked for release.
- P0: mobile `375x667` action area overlaps the recent log.
- P1: desktop `1280x720` action/log overlap.
- P1: mobile expanded state-strip value lines collapse to zero height; on
  `375x667`, expanded details can also push the action form below the viewport.
- Do not stage the current UI product files for a release commit until these are
  fixed and the four-viewport browser visual review is rerun.
- Existing screenshots and metrics are referenced from `/private/tmp`; those
  evidence files are not repository files and must not be staged.

## Batch 5 - Long Campaign Stability

Category: long campaign stability.

Files:

- `scripts/simulate-long-campaign.mjs`
- `tests/longCampaignStability.test.js`
- `docs/qa/stability-long-campaign-2026-05-26.md`

Scope:

- Adds deterministic 6-player, 72-turn long campaign simulation.
- Verifies retained transcript window, structured logs, multi-quest state,
  campaign memory retrieval, replay highlights, payload bounds, and disk-backed
  refresh recovery.

Pre-commit tests:

```sh
node --check scripts/simulate-long-campaign.mjs
node scripts/simulate-long-campaign.mjs --turns 72
node --test tests/longCampaignStability.test.js
npm run test
```

Known failures / caveats:

- None current after rerun.
- This batch should land after batches 2 and 3 because the simulation depends on
  structured memory and AI DM integration behavior.

## Batch 6 - Final QA Evidence And Release Gate

Category: release coordination docs and final gate.

Files:

- `docs/qa/table-party-dm-experience-commit-plan-2026-05-26.md`

Optional placement:

- Stage this plan with the final QA evidence commit, or leave it unstaged if the
  release owner wants only executable/product evidence in the branch.

Final pre-merge gate after all selected batches are staged:

```sh
git diff --cached --name-only
git diff --cached --check
npm run lint
npm run test
npm run harness:check
```

For a public-release claim, add a fresh live browser pass for the exact staged
UI batch before `harness:check` is treated as release evidence.

## Files That Must Not Be Staged

Do not use `git add -A` for this worktree. Use explicit path lists or
`git add -p`.

Never stage:

- `assets/generated/`
- `assets/generated/.DS_Store`
- `assets/generated/**/*.png`
- `/private/tmp/aidm-*` screenshots, metrics, stores, or browser probe files
- `tmp/` coordination prompts or scratch files
- coverage, trace, log, `.tmp`, `.bak`, `.swp`, or ad hoc browser capture files

Generated asset note:

- `assets/generated/` is currently ignored/externalized and about `669M`.
- Git reports `1635` ignored/untracked generated files under that path.
- Do not force-add generated rasters unless a separate asset-payload release plan
  explicitly changes the storage policy and reviewers approve it.

## Review Checklist Before Each Commit

Run this before each actual commit:

```sh
git diff --cached --name-only
git diff --cached --check
git status --short
```

The staged list must contain only the files for the intended batch. If
`assets/generated`, `/private/tmp`, broad `tmp/`, or unrelated docs appear in the
cached list, unstage before committing.
