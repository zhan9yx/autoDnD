# 0008 Player Asset Orchestration

## Requirement

AIDM must use its generated image assets as part of play, without exposing the entire asset catalog or admin-style asset controls in the player table. The user-facing interface should stay focused on scene, action, conversation, player state, event history, rewards, and current choices.

## Acceptance Criteria

- The player table does not expose a searchable asset library, asset count, bulk asset grid, or admin-style "show all" catalog controls.
- Generated assets remain loaded and managed internally for runtime scene selection and contextual event presentation.
- The stage uses the server-selected current scene asset and does not expose asset browsing controls to players.
- Opening chests, looting, finding relics, or receiving rewards can surface an event/reward card with an appropriate generated item image.
- Scene location, generated scene image, and adaptive soundscape can change as player actions move the story to forests, markets, shrines, camps, waterfalls, or combat danger.
- Asset metadata supports catalog management: families, variants, culture tags, uniqueness keys, descriptions, and provenance.
- Tests assert that the player UI is clean and that assets are integrated into gameplay rather than dumped into the interface.

## Non-Goals

- Do not implement a public admin/backend console in the player table.
- Do not claim thousands of assets are complete unless the actual generated files and manifest registrations exist.
- Do not use internet-sourced images.
