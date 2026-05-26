# Table State Strip Collapse QA - 2026-05-26

## Scope

- Requirement: expanded `table-state-strip` must not cover the party rail or stage core content.
- Fix shape: replace the expanded overlay/popover behavior with an inline reserved-space collapsible panel.
- Similar risk covered in scope: summary log detail expansion remains in-flow instead of fixed/absolute overlay.

## Implementation Evidence

- `public/styles.css`
  - `.table-state-strip` is in normal table flow with `height: auto`, `min-height: 36px`, and `overflow: hidden`.
  - `.state-strip-grid` collapsed state uses `max-height: 0`, no vertical padding, and hidden visibility.
  - `.table-state-strip[data-expanded="true"] .state-strip-grid` uses bounded inline space with `max-height: 96px` desktop, `136px` at <=680px, and `118px` at <=430px.
  - `.state-strip-grid` is no longer `position: absolute` or `position: fixed`.
  - `.table` grid rows reserve space before party/stage rows on desktop, tablet, and mobile breakpoints.
- `tests/staticUiStructure.test.js`
  - Static contract now asserts inline strip/grid behavior and rejects absolute/fixed expanded state-strip rules.
- `tests/noScrollUi.test.js`
  - No-scroll contract now asserts inline expanded state-strip behavior and in-flow summary log details.
- `tests/browserAutomation.test.js`
  - Browser QA CSS contract updated to the current mobile party/state row dimensions.
- `public/i18n.js`
  - Added/kept log filter i18n keys needed by concurrent log toolbar static checks.

## Verification

Passed:

```sh
node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js
```

Result: 6 tests passed.

Passed:

```sh
npm run test:browser-qa
```

Result: 3 tests passed.

Browser visual QA:

```sh
PORT=4209 AIDM_DATA_FILE=/private/tmp/aidm-table-state-strip-store.json npm run dev
```

- Desktop screenshot: `/private/tmp/aidm-table-state-strip-collapse-2026-05-26/desktop-expanded.png`
- Mobile screenshot: `/private/tmp/aidm-table-state-strip-collapse-2026-05-26/mobile-expanded.png`
- Metrics: `/private/tmp/aidm-table-state-strip-collapse-2026-05-26/overlap-metrics.json`

Measured desktop `1280x900` expanded state:

- `#tableStateDetails` computed `position`: `static`
- details-party overlap area: `0`
- details-stage overlap area: `0`
- details-party gap: `10px`
- details-stage gap: `106px`

Measured mobile `390x844` expanded state:

- `#tableStateDetails` computed `position`: `static`
- details-party overlap area: `0`
- details-stage overlap area: `0`
- details-party gap: `6px`
- details-stage gap: `90px`

## Risk Notes

- The working tree contains many unrelated parallel-worker edits outside this task. This QA only validates the table-state-strip collapse behavior and immediately adjacent no-scroll/static browser contracts.
- Full `npm run harness:check` was not run in this worker pass because the requested scope prioritized targeted static tests and browser QA.
