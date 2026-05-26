# Table Party Visual Review - 2026-05-26

## Scope

Worker 09 browser visual QA against the current local app on branch `codex/table-strip-party-dm-experience`. This pass focused on visible table-party issues only and did not make product code changes.

The reviewed room was advanced past initialization before capture:

- Seeded room: `room_ef47a7c80fc84707`
- Phase: `scene`
- Round: `3`
- Party: 3 API-seeded players plus 1 browser-joined player (`澜灯`)
- Transcript: `32` entries after browser join
- Scene pressure: threat/danger `5 / 6`, clues `5 / 6`, deadline `6 / 6`
- Browser player state: local player joined, but current turn belonged to `青羽`; action form was reviewed in the waiting/blocked state.

## Artifacts

Screenshot directory: `/private/tmp/aidm-table-party-visual-2026-05-26/`

Metrics: `/private/tmp/aidm-table-party-visual-2026-05-26/visual-metrics.json`

Screenshots:

- `/private/tmp/aidm-table-party-visual-2026-05-26/desktop-1440x900-main.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/desktop-1440x900-state-strip-expanded.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/desktop-1440x900-state-drawer.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/desktop-1440x900-full-log-summary.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/desktop-1280x720-main.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/desktop-1280x720-state-strip-expanded.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/desktop-1280x720-state-drawer.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/desktop-1280x720-full-log-summary.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/mobile-390x844-main.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/mobile-390x844-state-strip-expanded.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/mobile-390x844-state-drawer.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/mobile-390x844-full-log-summary.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/mobile-375x667-main.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/mobile-375x667-state-strip-expanded.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/mobile-375x667-state-drawer.png`
- `/private/tmp/aidm-table-party-visual-2026-05-26/mobile-375x667-full-log-summary.png`

## Blocking Findings

1. P0 mobile `375x667` action area overlaps the recent log.
   - Evidence: `mobile-375x667-main.png`.
   - DOM metrics: `overlaps.actionTranscript=true`; `#actionForm` is `top=571.24`, `bottom=642`, while transcript content remains visible underneath it.
   - Visual impact: the action tabs and wait button cover the bottom summary log rows. The player cannot cleanly read the latest roll/log while deciding what to do.

2. P1 `1280x720` desktop also has action/log overlap.
   - Evidence: `desktop-1280x720-main.png`.
   - DOM metrics: `overlaps.actionTranscript=true`; `#actionForm` is `top=581.89`, `bottom=683`.
   - Visual impact: the lower log row is partially under the action form. This is less severe than `375x667`, but `1280x720` is a common laptop viewport.

3. P1 mobile `table-state-strip` expanded details lose their values.
   - Evidence: `mobile-390x844-state-strip-expanded.png`, `mobile-375x667-state-strip-expanded.png`.
   - DOM metrics at `390x844`: all six `#tableStateDetails article strong` values had `height=0`; only labels such as `回合`, `轮次`, `遭遇`, `同步`, `玩家`, `音频` were visible.
   - Additional `375x667` impact: expanded strip pushed the action form below the viewport (`bottom=690.59` for a `667px` viewport).

## Non-Blocking Observations

- Party status bar did not geometrically overlap the topbar, state strip, stage, or transcript in main captures. On mobile it is horizontally scrollable, so only the first two cards are visible by default.
- HP/MP red-blue bars were readable in visible party cards: about `180px` wide on desktop and `140px` wide on mobile. Full party-card text is clipped inside button bounds, but the visible name/class/HP/MP values remain understandable.
- Full log summary density is acceptable in the drawer. All checked viewports showed `32 visible / 32` with no document horizontal overflow.
- Threat/clue state is understandable in the stage and state drawer. The drawer clearly shows objective, clues `5 / 6`, pressure `5 / 6`, and deadline `6 / 6`; stage tracker labels also expose current and next thresholds.

## Recommended Priority

1. Fix action-form reservation in the transcript panel for short heights first. The grid should reserve the action row instead of letting summary log content render underneath it; also consider lowering the main summary row limit at `<=720px` and `<=667px`.
2. Fix mobile expanded state-strip article sizing. Ensure the `strong` value lines have non-zero height and remain visible; if needed, increase expanded strip height or move details into a scrollable area with explicit row sizing.
3. Re-run the same four viewport screenshots after the layout fixes, ideally including an active-local-player action state in addition to the waiting state.

## Emergency Closure Note

Emergency visual closure pass completed after the short-viewport layout fix.

- Code path: `public/styles.css` now keeps the default `@media (max-width: 430px)` table row contract at `auto auto 94px minmax(104px, 15dvh) minmax(0, 1fr)`, then applies the `375x667` compression only in `@media (max-width: 430px) and (max-height: 700px)`.
- Transcript/action fix: `.transcript-panel` reserves the action form with a `max-content` grid row; short desktop and short mobile media queries lower fixed chrome heights instead of overlaying the action form.
- State strip fix: expanded strip values have explicit non-zero row sizing, line-height, wrapping, and scroll-limited expanded height on mobile.
- Fresh screenshot directory: `/private/tmp/aidm-emergency-visual-closure-2026-05-26/`
- Fresh metrics: `/private/tmp/aidm-emergency-visual-closure-2026-05-26/metrics.json`
- `desktop-1280x720-main.png`: `actionTranscriptOverlap=false`, `messageActionOverlap=false`, `actionBottom=683` in a `720px` viewport.
- `mobile-375x667-main.png`: `actionTranscriptOverlap=false`, `messageActionOverlap=false`, `actionBottom=642` in a `667px` viewport.
- `mobile-375x667-state-strip-expanded.png`: expanded detail values all had positive heights (`18.39px` minimum), and action remained inside the viewport at `bottom=642`.
