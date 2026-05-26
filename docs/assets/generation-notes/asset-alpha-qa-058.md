# Asset Alpha QA 058

Date: 2026-05-26 Asia/Shanghai.

Worker: 058 alpha-review worker.

Scope: alpha/chroma-key QA record only for `assets/generated/icons/aidm-status-hazard-058-01.png` through `assets/generated/icons/aidm-status-hazard-058-64.png`.

Input reference: `docs/assets/generation-notes/icon-sheets-058-059-slicing.md`.

No images, source sheets, manifests, runtime files, public files, or other asset files were generated, sliced, or edited in this pass.

## Count And Continuity

| Range | Expected | Found | Continuity | PNG metadata |
| --- | ---: | ---: | --- | --- |
| `aidm-status-hazard-058-01.png` through `aidm-status-hazard-058-64.png` | 64 | 64 | `01` through `64`, no gaps | all 512 x 512, 8-bit RGBA PNG |

## Alpha QA Decision

Decision: `accept-with-risk`.

Rationale: the requested samples remain readable as icons after alpha cleanup, and alpha-aware pixel parsing found no visible pure-green or near-pure-green residual edge pixels in the sampled files. A full-range scan also found no files with visible pure `#00ff00` or near-pure green pixels at alpha >= 16. The remaining risk is content-specific: sheet 058 includes intentional poison, acid, gas, and glow effects, so the chroma-key cleanup can trim small green effect fringes. This looks like edge/detail loss risk rather than subject-destroying alpha loss.

## Required Sample Review

| Sample | Subject readability | Alpha/chroma observation | Result |
| --- | --- | --- | --- |
| `058-01` | Potion bottle and skull remain clear. | Green poison/glow is still readable, but fine green flame edges are plausible chroma-key loss areas. No visible pure-green edge pixels found. | pass with risk |
| `058-08` | Purple vortex remains clear. | No subject loss observed. No visible pure-green edge pixels found. | pass |
| `058-16` | Golden starburst/compass remains clear. | Outer greenish glow/splatter may be thinned by chroma-key, but core icon is intact. No visible pure-green edge pixels found. | pass with risk |
| `058-32` | Purple hazard orb remains clear. | No subject loss observed. No visible pure-green edge pixels found. | pass |
| `058-48` | Dark vortex/void remains clear. | No alpha-driven subject loss observed. No visible pure-green edge pixels found. | pass |
| `058-64` | Gold device/alarm icon remains clear. | No alpha-driven subject loss observed. No visible pure-green edge pixels found. | pass |

## Verification Evidence

Count and PNG header check:

```text
count: 64
first: aidm-status-hazard-058-01.png
last: aidm-status-hazard-058-64.png
missing: []
bad PNG headers/dimensions/color type: []
```

Sample `sips` metadata check:

```text
058-01: 512 x 512, hasAlpha: yes
058-08: 512 x 512, hasAlpha: yes
058-16: 512 x 512, hasAlpha: yes
058-32: 512 x 512, hasAlpha: yes
058-48: 512 x 512, hasAlpha: yes
058-64: 512 x 512, hasAlpha: yes
```

Alpha-aware sample pixel check:

```text
058-01: visiblePureGreen=0, visibleNearGreen=0, visibleGreenLikePct=56.6
058-08: visiblePureGreen=0, visibleNearGreen=0, visibleGreenLikePct=9.5
058-16: visiblePureGreen=0, visibleNearGreen=0, visibleGreenLikePct=20.3
058-32: visiblePureGreen=0, visibleNearGreen=0, visibleGreenLikePct=8.1
058-48: visiblePureGreen=0, visibleNearGreen=0, visibleGreenLikePct=7.5
058-64: visiblePureGreen=0, visibleNearGreen=0, visibleGreenLikePct=7.5
```

Full-range visible green-edge scan:

```text
visiblePureGreenFiles: []
visibleNearGreenFiles: []
lowVisibleFiles: []
```

Final command required by task:

```bash
git diff --check -- docs/assets/generation-notes/asset-alpha-qa-058.md
```
