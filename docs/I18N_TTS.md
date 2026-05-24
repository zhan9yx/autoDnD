# Bilingual And Voice Support

## Language Model

AIDM supports English (`en`) and Simplified Chinese (`zh`).

- The create-room flow stores `language` on the room.
- The UI can switch language at runtime and persists the choice in local storage.
- Deterministic local narration, room lifecycle messages, roll logs, and validation errors follow the room language.
- OpenAI narration prompts include the requested output language so hosted model output can match the table language.

The current implementation intentionally does not machine-translate old transcript entries. Past entries remain in the language they were generated in, which preserves auditability for replay and memory tests.

## Voice Playback

The shipped voice path is still browser-side `speechSynthesis`.

- It has no monetary cost.
- It does not require a server process.
- It reads new transcript entries in real time when Voice is enabled.
- The user can manually read the latest entry and stop playback.
- It uses the browser voice list first, then profile pitch/rate/volume to make speakers distinct.

This is not voice cloning. It is lightweight speaker differentiation using local voices, pitch, and rate.

## Voice Profile Catalog

`src/core/ttsProfiles.js` and `public/tts.js` expose a stable role catalog for both English and Chinese.

Current profile families:

- Table control: `aidm`, `rules`, `table`.
- Generic speaker fallbacks: `player`, `npc`.
- Social and age coverage: `noble`, `young-hero`, `elder`, `elder-woman`, `child`.
- Class and profession color: `warrior`, `ranger`, `mage`, `cleric`, `rogue`, `bard`, `captain`, `artisan`.
- Species or body type: `dwarf`, `elf`, `orc`, `tiefling`, `halfling`, `gnome`, `dragonborn`, `construct`.
- NPC flavor: `occult-scholar`, `guardian`, `merchant`, `oracle`, `trickster`, `villain`, `spirit`, `monster`.

The settings menu exposes these profiles in compact groups instead of one long list:

- Core voices: table control, player fallback, and generic NPC fallback.
- People and classes: noble, young hero, and common adventuring classes.
- Lineage and bodies: dwarf, elf, orc, tiefling, halfling, gnome, dragonborn, and construct-style voices.
- NPC specials: elders, merchants, villains, spirits, monsters, and other scene-specific roles.

The profile API also returns display-ready bilingual metadata so the UI does not need to assemble labels by hand:

- `bilingualLabel`, for example `Mage / 法师`.
- `group.displayName.en` and `group.displayName.zh` for menu sections.
- `menuGroupLabel` localized to the current UI language.
- `voiceSummary.en` and `voiceSummary.zh`, combining the profile personality and usage guidance.

Browser voices are filtered to the active UI language, sorted to prefer local system voices when the browser exposes `localService`, and capped in the menu so large OS voice catalogs do not crowd out role profiles. A previously selected browser voice remains visible even when it falls outside the compact cap.

Selection rules:

- DM/GM/host speakers map to `aidm`.
- System/table speakers map to `table` unless a specific role is provided.
- Exact role aliases win over generic NPC/player fallback.
- Role words inside an author string are matched deterministically, for example `NPC orc raider`, `clockwork automaton`, `女法师`, or `秘术学者`.
- Gender, age, and ambience traits can resolve a stronger profile when no exact role is provided, for example `female elder`, `young hero`, `noble courtier`, `spirit`, or `monster`.
- New social and profession aliases cover table-common speakers such as commanders, artisans, oracles, and trickster performers without adding a paid TTS dependency.
- Unknown player names keep stable per-name pitch/rate variation.
- Generic unknown NPC speakers use the common `npc` profile instead of player color.

Each profile stores:

- English and Chinese display names.
- Role, personality, age, and NPC/player usage guidance.
- `rate`, `pitch`, and `volume` for browser playback.
- A `voiceTuning` copy of the pitch/rate/volume recommendation for UI and future adapters.
- `gender`, `age`, `speakerType`, and lightweight `ambience` tags for deterministic role selection and future local adapters.
- English and Chinese browser voice name hints.
- Placeholder hints for `espeak-ng`, `piper`, `sherpa-onnx`, and `kokoro` so a later server adapter can choose a compatible local voice/model without changing the profile contract.

## Adaptive Ambience

The ambience path is deterministic and browser-local: `src/core/soundscape.js` selects a profile, and `public/ambience.js` synthesizes the layers with Web Audio.

Supported layer families now include:

- Weather intensity: light rain, heavy rain, light wind, gale wind, distant thunder, and close thunder.
- Natural locations: forest leaves and birds, pond water and frogs, waterfall spray, campfire crackle, crickets, and cicadas.
- Interior and ritual locations: archive page rustle, old shelf creaks, dry archive room tone, cistern echoes, stone reverb, and incense air.
- General indoor scenes: quiet room tone, soft floorboard creaks, and cloth rustle for studies, private rooms, offices, and other non-tavern interiors.
- Social scenes: market or tavern crowd beds, low whispers, glass toasts, cup clatter, applause, cheering, jeers, angry shouts, song, and chant.

Selection uses scene location, weather, mood, structured `soundscapeTags`, recent narration, and any already attached scene asset or presentation metadata. Current scene location remains the anchor, with compatible weather layered on top; for example a rainy archive can add soft rain at the windows, while a clear archive will not inherit stale tavern, thunder, or market sounds from prior narration. Clear or sunny scene assets are treated as current weather evidence, so stale transcript mentions of storms do not cause thunder over a clear backdrop.

Current-scene evidence is now split from recent transcript evidence before scoring. Location-locked scenes use current weather and current mood for layer composition, so a forest, archive, shrine, or generic indoor room does not inherit tavern songs, market crowds, toasts, heavy rain, or thunder just because those appeared in a previous transcript entry. Recent narration can still help when the current scene has no stronger location/weather anchor.

## Open-Source Provider Route

The short-term default remains browser `speechSynthesis`; no local model is downloaded or bundled.

Provider catalog:

- `browser-speech-synthesis`: shipped fallback, client-only, no model download.
- `piper`: preferred first neural local target for fast local voices once curated voice models are selected. The active OHF fork describes Piper as a fast local neural TTS engine and includes CLI/API surfaces.
- `sherpa-onnx`: best provider-neutral ONNX integration target. Its TTS docs cover multiple model families and multilingual options, including Kokoro and Piper-style models.
- `kokoro`: compact neural voice option when a compatible runtime/model is installed separately. Treat as a model/runtime family, not the default engine.
- `espeak-ng`: lowest-footprint fallback when naturalness matters less than offline, compact, multilingual synthesis.

Recommended sequence:

1. Keep browser `speechSynthesis` as the zero-install default.
2. Add a provider-neutral server adapter contract without binding the UI to one engine.
3. Prototype `espeak-ng` first for the smallest offline proof of life.
4. Add Piper or Sherpa-ONNX behind the same contract for better quality once English and Chinese voices are curated.
5. Evaluate Kokoro under Sherpa-ONNX or a separate local runtime only after model licensing, language coverage, and hardware cost are verified.

Reference links:

- [Piper / OHF piper1-gpl](https://github.com/OHF-Voice/piper1-gpl)
- [Sherpa-ONNX TTS docs](https://k2-fsa.github.io/sherpa/onnx/tts/index.html)
- [Kokoro-82M model card](https://huggingface.co/hexgrad/Kokoro-82M)
- [eSpeak NG](https://github.com/espeak-ng/espeak-ng)

The project exposes provider metadata through:

```bash
GET /api/tts/providers
```

## Future Server-Side TTS Contract

The planned local server contract should stay provider-neutral:

```http
POST /api/tts/synthesize
Content-Type: application/json

{
  "provider": "espeak-ng",
  "language": "zh",
  "speaker": "aidm",
  "text": "封印账本的线索浮出水面。"
}
```

Expected response:

```json
{
  "audioUrl": "/api/tts/audio/tts_...",
  "mimeType": "audio/wav",
  "provider": "espeak-ng",
  "cached": true
}
```

Do not add paid cloud TTS as the default provider. Paid providers can be optional premium adapters after privacy, billing, and consent controls exist.
