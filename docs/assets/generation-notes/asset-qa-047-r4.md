# Asset QA 047 R4

Date: 2026-05-26 Asia/Shanghai.

Worker: 047-only final QA closer.

Scope reviewed only the requested R4 item slices:

- `assets/generated/items/aidm-equipment-tool-047-01.png` through `assets/generated/items/aidm-equipment-tool-047-16.png`
- Focus check: `assets/generated/items/aidm-equipment-tool-047-12.png`

No assets, source sheets, prompts, manifests, runtime files, Harness files, or unrelated notes were edited.

## Decision

Overall decision: `accept-with-metadata-risk`.

Reason: the requested 047 item slice set is complete and continuously named, and the focused `047-12` PNG passed format, size, alpha, and outer 8 px edge-alpha checks. This note is intentionally a narrow metadata/edge QA closeout, not a full semantic art review.

## Count Check

| Group | Expected | Matched total | Continuity | Status |
| --- | ---: | ---: | --- | --- |
| `aidm-equipment-tool-047-*.png` | 16 | 16 | `01` through `16` | pass |

Read-only sequence check:

```text
count=16
expectedCount=16
continuous=true
missing=[]
extra=[]
```

## Focus Metadata

`file` result for `047-12`:

```text
assets/generated/items/aidm-equipment-tool-047-12.png: PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
```

`sips` result for `047-12`:

```text
format: png
pixelWidth: 512
pixelHeight: 512
hasAlpha: yes
```

## Edge Scan

Read-only PNG decode scan of the outer 8 px band for `047-12`:

```text
edgeBandPx=8
edgePixels=16128
nonzeroAlpha=0
opaqueAlpha=0
partialAlpha=0
minAlpha=0
maxAlpha=0
```

Result: pass. No non-transparent pixels were found in the outer 8 px band of `aidm-equipment-tool-047-12.png`.

## Verification

Requested note check:

```bash
git diff --check -- docs/assets/generation-notes/asset-qa-047-r4.md
```

Result: pass.
