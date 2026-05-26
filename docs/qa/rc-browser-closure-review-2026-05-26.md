# RC Browser Closure Review - 2026-05-26

Reviewer scope: read-only audit of Raman's RC Visible Browser Closure evidence. This review did not handle or close any historical Mencius agent, did not commit, did not revert, and did not edit product code.

Reviewed inputs:

- `/private/tmp/aidm-rc-browser-closure-2026-05-26/summary.json`
- `/private/tmp/aidm-rc-browser-closure-2026-05-26/summary-supplement.json`
- `/private/tmp/aidm-rc-browser-closure-2026-05-26/*.png`
- `docs/qa/rc-browser-closure-2026-05-26.md`

## Summary JSON

`summary.json` is usable as current RC visible-browser evidence:

```text
current git HEAD: d5919ee
summary head: d5919ee
ok: true
screenshots: 61
assertions: 64
blockers: 0
brokenImages: 0
generated PNGs tracked by Git: 0
```

Raw browser noise is not zero, but it is classified as recovered/non-blocking:

```text
consoleErrors: 2
- favicon 404 from visible Chrome, accepted as default browser noise
- wrong-password 403, expected and recovered by the password-room flow

networkFailures: 1
- net::ERR_ABORTED with canceled=true during mobile warrior navigation/drawer flow
```

The review agrees with the report's blocker classification: these entries are not app asset misses, 5xx failures, uncaught exceptions, or broken-image failures.

## Screenshot Spot Check

Required sample screenshots exist and are non-empty:

```text
04-desktop-scene-started.png: 1280 x 900, 976408 bytes
20-mobile-430-main.png: 430 x 844, 285435 bytes
31-approval-rejected-player.png: 1365 x 900, 588119 bytes
36-broken-image-sweep.png: 1365 x 900, 815071 bytes
```

Visual spot check:

- Desktop scene evidence renders the table, party rail, scene art, current turn, log, and action composer.
- Mobile 430 evidence renders the compact table, party rail, log density, action composer, and no obvious horizontal overflow.
- Broken-image sweep evidence renders the drawer and overlay with `broken images: 0`, `generated image elements loaded/fallback-managed: 44`, Web Audio available, and `speechSynthesis` available.
- Approval rejected evidence exists and renders the approval-room screen, but the screenshot itself does not show an obvious rejected-copy banner. It appears to show the approval-room join/request surface. The automated flow may still have passed, but this specific image is weak visual proof of the rejected notice. If the release gate requires visible rejection copy, rerun or supplement this screenshot with the rejected message clearly visible.

## Docs Accuracy

`docs/qa/rc-browser-closure-2026-05-26.md` accurately records the actual RC run section:

```text
HEAD: d5919ee
summary.json ok: true
screenshots: 61
assertions: 64
blockers: 0
brokenImages: 0
```

The same doc also keeps an older "Current Main Preflight" block with `HEAD: 6ec51cf` and `git status --short: clean`. Treat that block as historical setup context, not as the current run state. The "Actual RC Run" section is the authoritative section for this RC evidence.

The remaining gaps are also recorded accurately:

- Actual audible quality is not claimed.
- Safari/mobile-native voice matrix remains open.
- Background-tab audio behavior remains open.
- Public launch gates `GATE-003` through `GATE-008` remain fail-closed until staging, ops, legal/privacy, security, load, support, and sign-off evidence is supplied.

## Verdict

This evidence can be used as the current RC visible-browser closure package for desktop/mobile layout, room flows, generated-raster fallback behavior, and broken-image sweep, with the caveats above.

It should not be used as public-launch approval, real audio-quality proof, Safari/mobile-native voice proof, or production staging/ops/legal/security/load/support sign-off.

Recommended follow-up: capture one additional approval-rejected screenshot with the rejection notice visibly present, or update the existing report to explain why the screenshot represents the post-rejection recovery state rather than the moment the rejected banner is visible.

## Follow-up Evidence

The rejected-notice gap above was closed with a focused visible-browser probe against the current uncommitted RC code:

```text
/private/tmp/aidm-rc-browser-closure-2026-05-26/31b-approval-rejected-notice-visible.png
/private/tmp/aidm-rc-browser-closure-2026-05-26/approval-rejected-notice-evidence.json
```

Probe result:

```text
ok: true
statusKey: join.rejected
accessState: approval-rejected
statusText: 你的加入申请已被拒绝。请调整角色，或先与主持确认后再重新申请。
```

Verdict update: approval rejection now has explicit visual evidence for the rejected-copy notice. The remaining caveats from this review are unchanged: this does not approve public launch gates, real audio quality, Safari/mobile-native voice, or production staging/ops/legal/security/load/support sign-off.
