# Bug Tracker

## BUG-0001 Defeated active player can crash campaign simulation

- Status: fixed in `0003-maturity-assets-evals`
- Found by: `npm run harness:check`
- Reproduction: five-player simulation can advance to a turn where the active player has `hp = 0`; a hostile action then calls `playerAttackEnemy`, which rejects dead attackers with `player is not alive`.
- Impact: long-running games can crash during combat-heavy sessions instead of handling defeat gracefully.
- Fix: combat exchange now skips player attacks for defeated actors, targets only living players for enemy actions, and marks defeat when no living player remains.

## BUG-0002 Generated raster assets not visible in the product asset library

- Status: fixed in `0003-maturity-assets-evals`
- Found by: maturity review and browser visual QA.
- Reproduction: generated ChatGPT image assets existed under `assets/generated/`, but the app loaded only `/assets/manifest.json`; scene raster assets were also hidden behind older vector scene cards in the preview order.
- Impact: the product could claim generated image assets existed while users still saw mostly deterministic SVG placeholders.
- Fix: the web app now loads and merges `/assets/generated/manifest.json`, serves PNGs with the correct content type, reports `134 assets / 2 sheets`, and prioritizes raster cards in category previews.
