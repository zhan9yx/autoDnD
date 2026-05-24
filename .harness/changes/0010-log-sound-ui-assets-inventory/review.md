# Review Notes

## Sub-Agent Inputs

- Player feedback identified P0 issues in main action visibility, character creation surfacing, audio controls occupying the play area, and hard-to-read logs.
- UI/UX review recommended moving audio/language into Settings, reducing topbar weight, keeping the player table one-screen, hiding join/create after current room membership, and replacing native-looking selects.
- Logging review recommended appending structured event metadata while preserving existing `type/author/text/createdAt` transcript compatibility.
- Soundscape review recommended more presets, hysteresis/priority rules, manual lock/auto modes, and short player-facing reason text.
- Product review defined v10.1-v10.10 as the maturity path and flagged asset mapping, settings, character entry, structured logs, and soundscape as current-cycle priorities.

## New User Requirements Recorded

- Personal player details: backpack, item inspection, item value, currency, condition, sale eligibility, buying and selling.
- Usable assets: image assets must bind to stats/effects and not exist as decorative pictures only.
- Spell scrolls: scroll definitions and spell effects must exist before generating or binding images.
- Memo: add a lightweight player notebook.
- Party status: avatars from character/species icons, HP/energy bars, intuitive current status.
- Dice UI: spinning dice state and final roll result; dice face assets can come from Image Generation.
- Chat channels: public table chat and party/faction private chat where applicable.
- Weather and ambience: richer visual variants plus layered adaptive audio that matches scene art and context.
- Asset library target: long-term 3000+ image assets with categories, variants, immersive descriptions, and BG3-like item taxonomy.
- Voice library target: expand toward at least a dozen local/open role voices beyond current browser defaults.

## Risks

- The 3000+ image target is a long-running asset production goal, not a single-turn code gate.
- Browser SpeechSynthesis voice availability varies by OS; open-source TTS requires optional local installation and packaging decisions.
- Trade and inventory actions need server-side authority before multiplayer economy can be production-safe.
- Generated asset sheets require deterministic metadata and dedupe checks to avoid an unmanageable library.

## Final Gate Notes

- Smoke should validate rain ambience as a weather family capability, not as the removed legacy `rain` preset. Current catalog coverage is `light-rain`, `heavy-rain`, and `thunderstorm`, with rain layers and `weather:rain` asset hints.
- Latest smoke run passed outside the sandbox and selected `light-rain`, confirming the room flow still exposes adaptive rain ambience.
