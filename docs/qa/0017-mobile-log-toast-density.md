# 0017 Mobile Log Toast Density QA

Date: 2026-05-25

## Scope

Focused mobile polish for the in-play table at 390px width after Meitner screenshot review.

## Reference

- Before/reference issue: `/private/tmp/aidm-0015-consolidated-browser-final3/17-mobile-main.png`
- After/live screenshot: `/private/tmp/aidm-0017-mobile-log-toast-density/mobile-after-final-v5.png`

## Findings

- Summary timeline rows now measure 34px in the live 390x844 capture.
- Main mobile summary transcript uses 12 rows instead of the desktop summary limit.
- Roll and reward rows keep `details.message-detail` affordances in compact summary mode.
- Reward toast text is reduced to `已入背包。`; full reward detail stays available through the state drawer and title text.
- Reward toast includes visible close and detail controls.
- Reward toast auto-dismisses after 3800ms.
- Reward toast does not overlap the action form in the final capture.

## Live Metrics

- Viewport: 390x844
- Toast: x 92, y 639, w 292, h 73
- Action form: x 9, y 714, w 372, h 105
- Toast/action overlap: false
- Recent row heights: 34px

## Notes

The live screenshot was captured from an isolated headless Chrome profile against local port `4205` with no new image assets.
