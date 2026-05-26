# UI Overlap Browser Review - 2026-05-26

## Scope

Independent browser visual QA against the current local AIDM app. The room was advanced past initialization into an active story state before review:

- Phase: `scene`
- Round: `3`
- Transcript: `15 条日志`
- Party: existing active `Iris`, local joined reviewer character `Noa`
- Evidence state: `1 个收获`, `6` local inventory items, `75` market cards loaded

## Viewports

- Desktop: `1440x900`
- Mobile: `390x844`
- Mobile: `375x667`

## Screenshots

Directory: `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/`

- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/desktop-1440x900-main.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/desktop-1440x900-log-drawer.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/desktop-1440x900-character-backpack.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/desktop-1440x900-market.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/desktop-1440x900-state-drawer.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/mobile-390x844-main.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/mobile-390x844-log-drawer.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/mobile-390x844-character-backpack.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/mobile-390x844-market.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/mobile-390x844-state-drawer.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/mobile-375x667-main.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/mobile-375x667-log-drawer.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/mobile-375x667-character-backpack.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/mobile-375x667-market.png`
- `/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/mobile-375x667-state-drawer.png`

## Findings

1. Reward toast overlaps the bottom action/log area in all main captures.
   - Desktop `1440x900`: toast intersects the action form area in the bottom-right of the transcript panel.
   - Mobile `390x844`: toast sits over the lower action controls.
   - Mobile `375x667`: toast visibly covers the latest roll/log area and lower action controls.
   - Evidence: the three `*-main.png` screenshots above. DOM metrics also reported `toastActionOverlap: true` for all three main captures.

2. Reward toast close button has a latent text-collision risk.
   - The close button bounding box intersects the toast copy container in DOM metrics on all three main captures.
   - The current short Chinese text remains readable in the screenshots, but longer reward names/details could run under the close control.

3. No blocking overlap found in the reviewed drawers.
   - Log drawer, character/backpack drawer, market drawer, and state drawer stayed within viewport bounds at all three sizes.
   - No horizontal document overflow was detected.
   - No visible button text overflow was detected in the reviewed surfaces.
   - Log drawer density remained readable: mobile visible message card heights were roughly `149-170px`, with scroll available.

## Submit Recommendation

Do not submit the current UI overlap fix as final unless the reward toast/action-form overlap is fixed or explicitly accepted as non-blocking. The drawer-specific surfaces look ready from this pass; the remaining visible risk is the toast placement on the main play surface.

## Verification Commands

```bash
PORT=4217 AIDM_DATA_FILE=/private/tmp/aidm-ui-overlap-browser-review-2026-05-26/store.json npm run dev
curl -sS http://127.0.0.1:4217/api/health
node --input-type=module - # local API seed to create/join/start/action an active story room
```

Browser verification used the Codex in-app Browser viewport override for `1440x900`, `390x844`, and `375x667`, then captured the five requested surfaces per viewport. The temporary server was stopped after capture, and the temporary store file was removed so the screenshot directory contains PNG evidence only.
