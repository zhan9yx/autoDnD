# Requirement Review

## Decision

Approved. Build this as an incremental product polish layer on the existing Node/browser app.

## Product Review

- The current UI is functional but too much of the hero scene is drawn with canvas primitives, which makes the table feel less asset-rich than the product promise.
- Background voice exists, but session ambience is missing. This leaves long play sessions feeling static.
- Asset preview exists, but scene artwork is not connected strongly enough to the active table state.
- The right-side panel is dense; sound and image controls should be compact, explicit, and recoverable.

## Technical Review

- Prefer generated image sheets and checked-in raster assets for scene backdrops.
- Keep procedural Web Audio for ambience because it has zero licensing cost, small footprint, and no network dependency.
- Keep deterministic soundscape selection in a core module so it can be tested independently of the browser.
- Browser audio must be opt-in due autoplay restrictions and user comfort.

## Risks

- MUST FIX: Audio loops can become annoying if users cannot stop or reduce them quickly.
- MUST FIX: Generated scene artwork must not hide clocks or action controls.
- LOW: Browser Web Audio synthesis varies slightly across platforms.
- INFO: This change improves local product quality but does not replace production-grade authored audio packs.
