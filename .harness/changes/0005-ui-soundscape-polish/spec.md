# 0005 UI Soundscape Polish

## Requirement

AIDM must feel more like a mature virtual tabletop product instead of an MVP control panel. The table should use generated raster scene artwork as the primary visual surface, keep code-driven visuals limited to atmospheric overlays, improve the host/player operating path, and add an adaptive background music and ambient sound control layer.

## Acceptance Criteria

- The main stage uses generated image assets for scene presentation instead of relying on a fully code-drawn canvas scene.
- Weather and mood effects remain lightweight code overlays and are driven by room state.
- The table includes a dedicated ambience panel with background music and environmental layers.
- Ambience can be enabled, stopped, and tuned for master/music/ambient volume.
- Ambience automatically changes when the scene, threat, encounter state, director beat, or transcript context changes.
- Supported ambience categories include rain, forest, pond, waterfall, campfire, insects, city/market, mystery, calm night, and combat tension.
- The UI exposes a richer but still scannable table layout for stage, action log, roster, continuity, director, encounter, replay, assets, voice, and ambience.
- Generated image assets are managed through the existing generated asset manifest and are reusable by scene selection and asset library preview.
- New copy is bilingual in English and Chinese.
- The implementation remains local-first with no paid audio service and no mandatory external audio downloads.
- Tests cover soundscape strategy, UI hooks, generated asset registration, and Harness gates.

## Non-Goals

- Do not add a paid music or sound-effects provider.
- Do not ship copyrighted third-party music.
- Do not require microphone input, speech-to-text, or user audio uploads.
- Do not replace the whole app framework in this change.
