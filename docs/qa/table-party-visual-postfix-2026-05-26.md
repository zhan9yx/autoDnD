# Table Party Visual Postfix QA - 2026-05-26

## Scope

Read-only visual recheck for Godel's 3 table-party blockers on branch `codex/table-strip-party-dm-experience`.

No product code changes were made. This pass started a temporary dev server with a temporary data file, created a non-initial active table/story state, closed the transient reward toast before capture, then measured the requested viewports.

Seeded active state:

- Room: `room_fa892f73b860442e`
- Phase: `scene`
- Round: `3`
- Active player: `墨衡`
- Party size: `3`
- Transcript entries: `38`
- Clocks: clues `6`, danger `1`, deadline `4`, quest `6`
- Combat state: `foreshadowed`

## Artifacts

- Screenshot directory: `/private/tmp/aidm-visual-closure-postfix-2026-05-26/`
- Metrics JSON: `/private/tmp/aidm-visual-closure-postfix-2026-05-26/visual-metrics.json`
- Temporary data file: `/private/tmp/aidm-visual-closure-postfix-2026-05-26/aidm-store.json`

Screenshots:

- `/private/tmp/aidm-visual-closure-postfix-2026-05-26/mobile-375x667-main.png`
- `/private/tmp/aidm-visual-closure-postfix-2026-05-26/desktop-1280x720-main.png`
- `/private/tmp/aidm-visual-closure-postfix-2026-05-26/mobile-390x844-state-strip-expanded.png`
- `/private/tmp/aidm-visual-closure-postfix-2026-05-26/mobile-375x667-state-strip-expanded.png`

## Verdict

No remaining P0/P1 found for the 3 requested Godel blockers.

1. `375x667` action form vs transcript/summary overlap: closed.
2. `1280x720` action form vs transcript/summary overlap: closed.
3. Mobile expanded state strip value height and viewport pressure: closed.

## Metrics

| Capture | Action bottom | Viewport overflow | Action/transcript overlap | Summary message overlap | State value min height | Action in viewport |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `mobile-375x667-main.png` | `642px` | `0px` | `0px^2` | `0` messages | `18.390625px` | yes |
| `desktop-1280x720-main.png` | `683px` | `0px` | `0px^2` | `0` messages | `19.1875px` | yes |
| `mobile-390x844-state-strip-expanded.png` | `819px` | `0px` | `0px^2` | `0` messages | `18.390625px` | yes |
| `mobile-375x667-state-strip-expanded.png` | `642px` | `0px` | `0px^2` | `0` messages | `18.390625px` | yes |

Computed table rows:

- `375x667` main/expanded: `105.594px 32px 68px 96px 325.406px`
- `1280x720` main: `76px 36px 72px 478px`
- `390x844` expanded: `105.594px 32px 94px 126.594px 445.812px`

## 430px CSS / Static Contract

Current base `@media (max-width: 430px)` `.table` rule:

- `public/styles.css:5505`
- `grid-template-rows: auto auto 94px minmax(104px, 15dvh) minmax(0, 1fr)`

Current short-height override:

- `public/styles.css:5889`
- `@media (max-width: 430px) and (max-height: 700px)`
- `grid-template-rows: auto auto 68px minmax(96px, 14dvh) minmax(0, 1fr)`

`browserAutomation` static contract:

- `tests/browserAutomation.test.js:93`
- Expected rows: `auto auto 94px minmax(104px, 15dvh) minmax(0, 1fr)`
- Metrics: `contractMatchesCurrentCss=true`, `actualEqualsExpected=true`

Recorded 430px line-height declarations:

- `public/styles.css:5526` `.topbar h2`: `line-height: 1.1`
- `public/styles.css:5541` `.topbar-actions .status-pill`: `line-height: 1`
- `public/styles.css:5654` `.transcript[data-log-density="summary"] .message .meta`: `line-height: 1`
- `public/styles.css:5665` `.transcript[data-log-density="summary"] .message p`: `line-height: 1.25`
- `public/styles.css:5704` `.full-transcript[data-log-density="summary"] .message .meta`: `line-height: 1.22`
- `public/styles.css:5720` `.full-transcript[data-log-density="summary"] .message-body-detail`: `line-height: 1.34`
- `public/styles.css:5811` `.combat-brief`: `line-height: 1.25`
- `public/styles.css:5867` `.action-mode-hint`: `line-height: 1.1`

Targeted static contract check:

```sh
node --test --test-name-pattern "static browser QA" tests/browserAutomation.test.js
```

Result: passed, `1` test.

## Notes

- The `375x667` captures use the short-height override at `public/styles.css:5889`, so computed rows differ from the base 430px contract by design.
- The verification script is `/private/tmp/aidm-visual-closure-postfix-2026-05-26/verify.mjs`.
