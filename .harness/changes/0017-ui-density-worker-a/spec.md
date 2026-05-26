# 0017 UI Density Worker A

## Requirement

Improve the in-play situation page and game table density without adding image assets:

- Keep round, encounter, sync, player summary, and audio as a compact expandable table-state strip.
- Make the party rail readable with more players by showing active/local/state cues in fixed-height cards.
- Increase table-log scan density with grouped timeline markers and expandable details.
- Increase scene backdrop value through existing visual-state tags and overlays.
- Preserve desktop and mobile no-horizontal-overflow constraints.

## Scope

In scope:

- `public/app.js`
- `public/styles.css`
- `public/i18n.js`
- Focused UI structure, no-scroll, bilingual, and player-access tests.
- A focused QA evidence note under `docs/qa`.

Out of scope:

- New image assets.
- 0013 auth/audio/spell-warrior browser evidence.
- 0015 release readiness and gate evidence.
- Asset inventory documents.

## Acceptance

- Non-high-frequency table state remains hidden by default and keyboard-expandable.
- Party cards include current status and scene context while retaining HP/MP affordances.
- Main transcript supports summary/dense/comfortable density and timeline grouping.
- Detail-heavy log rows can expand without making every row tall by default.
- Scene visual metadata remains compact and responsive.
- Focused syntax, UI, Harness status, and whitespace checks pass or record an explicit environment limitation.
