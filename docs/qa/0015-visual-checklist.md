# 0015 visual checklist

## Status

Worker B visual evidence is indexed for desktop, tablet, `<=430px` mobile, and 375px mobile checks. This closes the missing visual-checklist evidence dependency only; it does not pass public readiness and does not replace the full consolidated 0014 desktop/mobile browser acceptance pack.

Evidence screenshots:

- `/private/tmp/aidm-0015-worker-b-visual/01-1280-main.png`
- `/private/tmp/aidm-0015-worker-b-visual/02-1280-state-expanded.png`
- `/private/tmp/aidm-0015-worker-b-visual/03-1280-state-drawer.png`
- `/private/tmp/aidm-0015-worker-b-visual/04-768-main.png`
- `/private/tmp/aidm-0015-worker-b-visual/05-768-settings-drawer.png`
- `/private/tmp/aidm-0015-worker-b-visual/06-430-main.png`
- `/private/tmp/aidm-0015-worker-b-visual/07-430-state-expanded.png`
- `/private/tmp/aidm-0015-worker-b-visual/08-430-log-drawer.png`
- `/private/tmp/aidm-0015-worker-b-visual/09-375-main.png`
- `/private/tmp/aidm-0015-worker-b-visual/10-375-character-drawer.png`

## Event and log readability

- Trigger or fixture an `event-resolution` transcript entry with `structuredLog.type === "event.progression"` and `structuredLog.severity === "warn"`.
- Confirm the table log type chip reads `Event change` / `事件变化`, not `event-resolution` or `event.progression`.
- Confirm the visible log body describes the table-facing consequence, not raw JSON or `[object Object]`.
- Confirm the detail line tells the player the impact and next step, for example `Impact: Danger +1. Next: ...` / `影响：危险 +1。下一步：...`.
- Confirm warning-severity event progressions include the localized attention prefix and still fit in summary, dense, and comfortable log density modes.
