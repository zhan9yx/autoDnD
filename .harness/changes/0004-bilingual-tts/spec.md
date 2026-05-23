# 0004 Bilingual TTS

## Requirement

AIDM must support English and Chinese as first-class table languages and add a no-cost, lightweight voice narration path. The first implementation should localize the web interface, preserve the selected language in room state, make deterministic local narration and system events follow the room language, and provide browser-side speech playback with per-speaker voice profiles.

## Acceptance Criteria

- The room creation flow can choose English or Chinese.
- UI copy can switch between English and Chinese without reloading the app.
- Room state persists `language` and exposes it through API snapshots.
- Local deterministic narration, room lifecycle messages, roll text, and validation errors support English and Chinese.
- OpenAI narration prompt includes the requested output language.
- The table UI provides voice controls for auto-read, manual read latest, language-aware voice selection, rate, and pitch.
- Per-speaker voice profiles distinguish AIDM, rules, table/system, and players.
- TTS implementation uses zero-cost local browser speech playback now and documents open-source self-host providers: eSpeak NG for lowest footprint and Piper for higher-quality local neural voices.
- Tests cover bilingual room state, local narration, validation messages, TTS profiles, and UI hooks.

## Non-Goals

- Do not ship paid cloud TTS.
- Do not require downloading large voice models in this change.
- Do not record player microphone audio or add speech-to-text.
