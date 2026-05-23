# Bilingual And Voice Support

## Language Model

AIDM supports English (`en`) and Simplified Chinese (`zh`).

- The create-room flow stores `language` on the room.
- The UI can switch language at runtime and persists the choice in local storage.
- Deterministic local narration, room lifecycle messages, roll logs, and validation errors follow the room language.
- OpenAI narration prompts include the requested output language so hosted model output can match the table language.

The current implementation intentionally does not machine-translate old transcript entries. Past entries remain in the language they were generated in, which preserves auditability for replay and memory tests.

## Voice Playback

The shipped voice path is browser-side `speechSynthesis`.

- It has no monetary cost.
- It does not require a server process.
- It reads new transcript entries in real time when Voice is enabled.
- The user can manually read the latest entry and stop playback.
- Each author gets a deterministic speaker profile:
  - `AIDM`: narrator profile.
  - `Rules`: lower-pitch rules arbiter profile.
  - `Table` / `System`: compact system profile.
  - Player names: stable per-name pitch/rate variation.

This is not voice cloning. It is lightweight speaker differentiation using local voices, pitch, and rate.

## Open-Source Provider Choice

The default self-host provider target is eSpeak NG.

Why eSpeak NG:

- Open-source and offline.
- Compact enough for a lightweight tabletop app.
- Multilingual enough to cover English and Chinese fallback use.
- Can be run as a CLI or embedded later as a native library.

Piper is the higher-quality optional target.

Why not make Piper mandatory now:

- It needs downloaded ONNX voice models.
- Voice model files add disk footprint.
- Chinese and English voice availability must be curated before a production voice marketplace is credible.

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
