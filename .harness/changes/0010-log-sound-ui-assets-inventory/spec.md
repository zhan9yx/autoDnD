# 0010 Log Sound UI Assets Inventory

## Requirement

This change continues the v10 productization pass for the player-facing AIDM table. The product must move away from a debug-like table and toward a playable tabletop client: readable structured logs, richer adaptive ambience, refined controls, one-time character creation, usable generated assets, player inventory and notes, party status, dice result presentation, chat channels, and a scalable asset/voice pipeline.

## Scope

- Fix the local Python/Pillow Rosetta issue or document a safe arm64 replacement path so image sheets can be sliced reliably.
- Provide structured log templates for player, chat, roll, AIDM narration, combat, reward, system, settings, trade, inventory, and notes events.
- Move language, voice, ambience, and other non-core controls into a Settings menu.
- Show character creation only during room creation or a player's first join flow; hide it during gameplay for already joined players.
- Improve native selects and form controls so they feel designed and remain usable on mobile.
- Use Image Generation sheets for character/race/class/spell/dice/item assets, then slice, classify, describe, and bind them to game data.
- Add player detail management: backpack, item detail, immersive description, value, currency, condition, tradability, sell/buy flows, and spell scroll usage.
- Add a lightweight player memo/notebook entry.
- Improve party status with avatar icons, HP/energy bars, and readable current-state summaries.
- Add dice roll presentation with spinning dice state and final total display.
- Add chat channel support for public table chat and faction/party channel chat.
- Improve weather visuals and ambience composition: rain intensity, wind, thunder, social room noise, crowd, whisper, inn cup clinks, cheers, shouts, and singing.
- Expand open/local voice options toward at least a dozen character voice profiles while keeping browser SpeechSynthesis as fallback.
- Maintain a long-term asset target of 3000+ generated image assets with taxonomy, dedupe, variants, immersive descriptions, and runtime attributes.

## Acceptance Criteria

- A single Harness task list tracks every item above, including deferred production-scale goals.
- The current generated character option sheet is copied into the workspace, sliced, registered, and counted in the generated asset manifest.
- Asset metadata includes player-facing descriptions and runtime semantics, not only provenance.
- Inventory items are data-first: game stats, value, condition, use effect, and tradeability exist before image binding.
- Players can inspect their own backpack and memo without exposing backend/admin asset management.
- Roll logs expose structured values and the frontend can animate a dice result without relying on LLM math.
- Ambience selection includes richer presets/layers and avoids scene-inconsistent transitions.
- Tests cover the new data contracts, UI structure, asset availability, and existing smoke flow.

## Non-Goals

- Do not build a backend/admin asset marketplace UI in the player client.
- Do not complete all 3000 assets in one blocking pass; record the 3000+ target and implement repeatable generation/ingestion steps.
- Do not add paid TTS, paid audio packs, or video generation.
- Do not store raw prompts, secrets, or internal AIDM call payloads in public transcript logs.
