# 0006 No Scroll User Flow

## Requirement

AIDM must optimize the player-facing table so core play can be completed without relying on page scrolling. The main viewport should keep the scene, current turn, latest log, action input, and primary navigation visible. Secondary information should move into explicit drawers or dialogs instead of pushing the page into a long scroll.

## Acceptance Criteria

- When a room is open, the page body does not require vertical scrolling for core actions on desktop or mobile.
- The main table viewport keeps room header, generated scene, latest log, action input, and quick navigation visible.
- Party creation/roster, GM state, continuity, encounter, replay, assets, voice, and ambience details are accessible through overlay drawers or dialogs.
- Drawers have close controls, Escape handling, and do not create horizontal overflow.
- Mobile layout avoids a long stacked page; core play stays in one viewport with overlay access to extra panels.
- The transcript panel shows a compact latest-log flow and can open full details without needing page-level scroll.
- Bilingual copy covers the new controls in English and Chinese.
- A simulated human-user review produces at least 100 concrete issues across multiple user perspectives.
- Product analysis groups the 100+ issues into prioritized implementation decisions.
- Tests and browser verification cover the no-scroll operating model.

## Non-Goals

- Do not remove existing underlying game state, memory, combat, replay, asset, voice, or ambience features.
- Do not add a new frontend framework.
- Do not require real external user recruitment in this local development pass.
