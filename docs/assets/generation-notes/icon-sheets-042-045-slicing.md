# Icon Sheets 042-045 Slicing Notes

Date: 2026-05-25 Asia/Shanghai.

Scope: Icon sheet slicing worker A sliced source sheets 042 through 045 only. No source sheets, scene files, Harness files, manifest files, runtime files, public UI files, or other worker notes were modified.

## Source Dimensions And Crop Rule

All four source sheets are `1254x1254` RGB PNG files. They were sliced as row-major 4x4 sheets using `313x313` crops. The final 2 px right edge and final 2 px bottom edge were treated as source generation remainder and were not included in the sliced tiles.

| Sheet | Source file | Output directory | Tile | Remainder |
| --- | --- | --- | --- | --- |
| `aidm-action-icons-sheet-042` | `assets/generated/sheets/aidm-action-icons-sheet-042.png` | `assets/generated/icons/` | `313x313` | right 2 px, bottom 2 px |
| `aidm-spell-icons-sheet-043` | `assets/generated/sheets/aidm-spell-icons-sheet-043.png` | `assets/generated/spells/` | `313x313` | right 2 px, bottom 2 px |
| `aidm-scroll-icons-sheet-044` | `assets/generated/sheets/aidm-scroll-icons-sheet-044.png` | `assets/generated/items/` | `313x313` | right 2 px, bottom 2 px |
| `aidm-status-icons-sheet-045` | `assets/generated/sheets/aidm-status-icons-sheet-045.png` | `assets/generated/icons/` | `313x313` | right 2 px, bottom 2 px |

## Alpha Cleanup

All 64 output PNG files were alpha-cleaned from the flat green chroma-key background. The cleanup threshold matched the existing AIDM Pillow ingester condition:

```text
g > 150 and g - r > 70 and g - b > 70
```

Matching pixels were set to alpha 0. Non-matching pixels were kept opaque. No output is marked `needs-alpha-cleanup`.

## Output Ranges

| Prompt ref | Output files | Count | Status |
| --- | --- | --- | --- |
| `icon-sheet-042-actions` | `assets/generated/icons/aidm-action-icon-042-01.png` through `assets/generated/icons/aidm-action-icon-042-16.png` | 16 | `alpha-cleaned`, `sliced` |
| `icon-sheet-043-spells` | `assets/generated/spells/aidm-spell-icon-043-01.png` through `assets/generated/spells/aidm-spell-icon-043-16.png` | 16 | `alpha-cleaned`, `sliced` |
| `icon-sheet-044-scrolls` | `assets/generated/items/aidm-scroll-icon-044-01.png` through `assets/generated/items/aidm-scroll-icon-044-16.png` | 16 | `alpha-cleaned`, `sliced` |
| `icon-sheet-045-status` | `assets/generated/icons/aidm-status-icon-045-01.png` through `assets/generated/icons/aidm-status-icon-045-16.png` | 16 | `alpha-cleaned`, `sliced` |

Total output count: 64 PNG files.

## Review Flags

- `needs-regeneration`: none recorded in this slicing pass.
- `needs-alpha-cleanup`: none recorded in this slicing pass.
- Downstream work intentionally not performed: manifest registration and runtime integration remain outside this worker scope.

## Verification

Executed:

```bash
file assets/generated/icons/aidm-action-icon-042-*.png assets/generated/spells/aidm-spell-icon-043-*.png assets/generated/items/aidm-scroll-icon-044-*.png assets/generated/icons/aidm-status-icon-045-*.png
find assets/generated/icons assets/generated/spells assets/generated/items -type f \( -name 'aidm-action-icon-042-*.png' -o -name 'aidm-spell-icon-043-*.png' -o -name 'aidm-scroll-icon-044-*.png' -o -name 'aidm-status-icon-045-*.png' \) | wc -l
/Users/yixuan.zhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 - <<'PY'
from pathlib import Path
from PIL import Image
ROOT = Path('/Users/yixuan.zhang/Documents/AIDM')
patterns = [
    'assets/generated/icons/aidm-action-icon-042-*.png',
    'assets/generated/spells/aidm-spell-icon-043-*.png',
    'assets/generated/items/aidm-scroll-icon-044-*.png',
    'assets/generated/icons/aidm-status-icon-045-*.png',
]
files = sorted([p for pattern in patterns for p in ROOT.glob(pattern)])
issues = []
for path in files:
    image = Image.open(path)
    if image.size != (313, 313):
        issues.append(f'{path.relative_to(ROOT)} size={image.size}')
        continue
    if image.mode != 'RGBA':
        issues.append(f'{path.relative_to(ROOT)} mode={image.mode}')
        continue
    alpha = image.getchannel('A')
    min_a, max_a = alpha.getextrema()
    if min_a != 0 or max_a != 255:
        issues.append(f'{path.relative_to(ROOT)} alpha={min_a}-{max_a}')
print(f'checked={len(files)}')
print('issues=' + ('none' if not issues else '; '.join(issues)))
PY
git diff --check -- docs/assets/generation-notes/icon-sheets-042-045-slicing.md
```

Result:

```text
file checks: all 64 outputs are 313 x 313, 8-bit/color RGBA PNG, non-interlaced
output count: 64
alpha/size check: checked=64, issues=none
git diff --check: passed
```
