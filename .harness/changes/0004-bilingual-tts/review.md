# Requirement Review

## Decision

Approved. Keep the implementation lightweight and local-first.

## Technical Choice

- Immediate playback: browser `speechSynthesis`, because it has zero runtime cost, no server process, no model download, and works for table narration in the local web app.
- Open-source self-host target: eSpeak NG for the default low-footprint CLI provider because it is compact, offline, open source, and multilingual.
- Optional higher-quality target: Piper because it is local and more natural, but voice models increase disk footprint and operational setup.

## MUST

- Preserve room language at creation time.
- Localize core UI and guide controls.
- Give every transcript author a deterministic voice profile.
- Keep TTS opt-in and stop/pause controllable.
- Document limitations honestly.

## Deferred

- Server-side WAV generation with installed eSpeak NG/Piper binaries.
- User-uploaded custom voices.
- Voice cloning.
