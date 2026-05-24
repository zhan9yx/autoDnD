# 0013 UI Density QA

Status: partial runtime UI implementation recorded; live browser visual signoff remains open.

## Scope

The UI density sibling worker changed only player-facing public UI and focused static tests. Worker E did not edit those runtime files; it synchronized this QA record with the integrated 0013 status.

Implemented runtime UI changes:

- Collapsible `table-state-strip`: the main row keeps a compact headline visible and reveals Turn, Round, Encounter, Sync, Player, and Audio details through click, hover, or focus.
- Compact party roster: the party bar is a 48px horizontal roster rail with avatars, names, active/local tags, and compressed HP/MP meters so larger parties scroll sideways instead of growing vertically.
- Dense table log: the main transcript defaults to a dense mode showing up to 10 recent entries, adds event-type pills and structured detail lines, and keeps the full log drawer as the complete history entry point.
- Stage dynamics: existing generated scene assets remain intact while the stage adds a lightweight ambience overlay, scene pulse, and recent-change summary.

## Verified By Automated Checks

Original focused UI checks passed:

- `node --test tests/noScrollUi.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js`
- `node --check public/app.js`
- `node --check public/i18n.js`

Worker E integration reruns included the same coverage areas, and later Worker H/N reruns cleared the old browser-skeleton TODO count:

- `node --test tests/requirements.test.js tests/maturity.test.js tests/soundscape.test.js tests/ambienceEngine.test.js tests/noScrollUi.test.js` passed 42/42.
- `node --test tests/serverRoutes.test.js tests/releaseGateFlow.test.js tests/flowClosureExtended.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js` passed hard assertions with no TODO.
- `npm run test` current integrated baseline passed 262/262 tests, 0 failed, 0 TODO.

## Mobile Risk Closure

Ramanujan's mobile pass closed the static layout risks found after the density changes:

- 375px and 430px widths: top status pills, auth identity text, compact party rail, scene chips, scene summary, and action inputs now have explicit wrapping and overflow guards.
- 768px tablet width: the topbar, auth controls, and panel action rows now use responsive grid/flex rules instead of forcing cramped one-line layouts.
- Dense log header: the title, density toggle, full-log action, and turn badge now have narrow-screen wrapping rules so controls do not crowd the transcript.
- Scene art metadata: the compact scene image now has smaller mobile spacing for weather, season, motion, overlay chips, and bottom objective text to reduce overlap risk.

Ramanujan verification:

- `node --check public/app.js` passed.
- `node --test tests/noScrollUi.test.js tests/staticUiStructure.test.js` passed 5/5.
- `git diff --check -- public/index.html public/styles.css public/app.js tests/noScrollUi.test.js tests/staticUiStructure.test.js` passed.
- `npm run lint` passed with 79 JavaScript files checked.

## Not Yet Verified In Browser

- Desktop and mobile screenshots after the density changes.
- No-overlap checks for compact party rail, table state strip, dense log, drawers, Market, Replay, and action controls.
- Keyboard focus behavior for collapsed/expanded state strip and log density controls.
- Long party and long transcript ergonomics in a real browser.
- Reduced-motion and scene overlay behavior in browser.

## Boundary

This QA page records partial UI implementation. It does not close live browser QA for auth UI, password-room UI, host-approval UI, deployment readiness, or public readiness.
