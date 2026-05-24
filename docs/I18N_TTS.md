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
- Class and profession color: `warrior`, `ranger`, `mage`, `cleric`, `rogue`, `bard`.
- Species or body type: `dwarf`, `elf`, `orc`, `construct`.
- NPC flavor: `occult-scholar`, `elder`, `child`, `guardian`, `merchant`, `villain`.

Selection rules:

- DM/GM/host speakers map to `aidm`.
- System/table speakers map to `table` unless a specific role is provided.
- Exact role aliases win over generic NPC/player fallback.
- Role words inside an author string are matched deterministically, for example `NPC orc raider`, `clockwork automaton`, `女法师`, or `秘术学者`.
- Unknown player names keep stable per-name pitch/rate variation.
- Generic unknown NPC speakers use the common `npc` profile instead of player color.

Each profile stores:

- `rate`, `pitch`, and `volume` for browser playback.
- English and Chinese browser voice name hints.
- Placeholder hints for `espeak-ng`, `piper`, `sherpa-onnx`, and `kokoro` so a later server adapter can choose a compatible local voice/model without changing the profile contract.

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
