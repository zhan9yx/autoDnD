# 0007 Imagegen Scene Library

## Requirement

AIDM must expand its visual asset library with real ChatGPT Image Generation raster scene backdrops rather than code-generated scene visuals. The scene library should use a unified art direction, carry immersive names and descriptions, and expose metadata that both players and AIDM can understand for scene selection, soundscape matching, and replay context.

## Acceptance Criteria

- New project-bound scene assets come from ChatGPT Image Generation raster sheets, not SVG/code placeholders.
- Generated scene assets include stable names, immersive descriptions, tags, soundscape hints, tone, biome, encounter role, and provenance.
- The library has a documented path toward a 500-scene macro-backdrop catalog.
- Current iteration raises the generated raster scene count to a meaningful first production slice and keeps all referenced files in the workspace.
- Scene backdrops are macro environments suitable for hosting characters and interactable objects, not small icons.
- The UI can surface scene descriptions in asset detail and preserve stage accessibility labels.
- Tests assert scene metadata quality and generated asset provenance.
- Harness checks, smoke, and asset evaluation evidence are recorded before merge.

## Non-Goals

- Do not claim that all 500 final scene images are complete in this single local iteration unless the assets actually exist in the repo.
- Do not use internet-downloaded art.
- Do not replace deterministic UI controls with generated images.
