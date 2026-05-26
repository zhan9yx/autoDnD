# 0017 Mobile Log Toast Density

## Requirement

Polish the 390px mobile table surface after Meitner screenshot review showed dense table logs and a large reward toast competing with the action controls.

## Scope

- Make mobile summary logs behave like a compact timeline with lower row height.
- Keep details available from compact log rows without expanding every row by default.
- Reduce reward toast copy, size, and visible duration on mobile.
- Keep reward toast close and detail actions explicit.
- Capture live 390x844 browser evidence and record it in QA.

## Non-Goals

- Do not add image assets.
- Do not change core rules, game mechanics, or reward generation.
- Do not resolve unrelated concurrent worker changes in the dirty worktree.

## Acceptance Criteria

- At 390px width, summary log rows fit at compact timeline density and keep expandable detail affordances.
- Main table log uses a smaller mobile entry limit than desktop summary mode.
- Reward toast is short, auto-dismisses, and has visible close/detail controls.
- Reward toast does not overlap the main action form in the live 390x844 screenshot.
- Focused static/no-scroll/player UI tests and syntax checks pass.
