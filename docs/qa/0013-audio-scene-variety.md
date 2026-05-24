# 0013 Audio Scene Variety QA

Date: 2026-05-25 CST

## Scope

This sibling worker improves local browser-synth ambience and deterministic soundscape selection for natural weather and social scenes. It does not add audio assets, call paid audio services, or change AI provider wiring. Worker E only synchronized this QA record.

Files owned by the sibling audio pass:

- `public/ambience.js`
- `src/core/soundscape.js`
- `tests/ambienceEngine.test.js`
- `tests/soundscape.test.js`
- `docs/qa/0013-audio-scene-variety.md`

## Implementation Notes

- Added distinct synthetic profiles for drizzle, downpour sheet rain, splash transients, thunder rumble, lightning crackle, wind gusts, forest canopy wind, crowd babble, market vendor calls, and tavern patron babble.
- Added low-frequency gain modulation and texture shaping in the browser Web Audio graph so rain, wind, crowd, and voice beds are not static filtered noise.
- Added lightweight formant oscillator layers for market calls, tavern babble, shouting, and crowd beds so social ambience has clearer speech-like peaks instead of only filtered noise.
- Expanded soundscape layers while keeping existing preset ids stable: `light-rain`, `heavy-rain`, `thunderstorm`, `gale-wind`, `forest`, `market-city`, `tavern`, and `crowd-murmur`.
- Added `sceneVisualState` metadata to each selected soundscape. It exposes deterministic variant axes, a variant key, overlay hints, motion hints, and transition timing so the existing scene image can vary by weather, season, location, mood, and scene asset metadata without adding new image files.
- Kept all audio local to `AudioContext`, oscillator, gain, filter, and buffer-source synthesis.

## Verification

Original focused audio checks passed:

- `node --check public/ambience.js`
- `node --check src/core/soundscape.js`
- `node --test tests/soundscape.test.js tests/ambienceEngine.test.js` passed after the audio worker changes; the latest supplemental pass covers natural weather, clearer social voice formants, seasonal layers, and scene image variation metadata.
- `npm run lint` passed with `lint ok: 79 JavaScript files checked`.
- `git diff --check -- public/ambience.js src/core/soundscape.js tests/ambienceEngine.test.js tests/soundscape.test.js docs/qa/0013-audio-scene-variety.md` passed.

Worker E integration rerun included the audio tests:

```bash
node --test tests/requirements.test.js tests/maturity.test.js tests/soundscape.test.js tests/ambienceEngine.test.js tests/noScrollUi.test.js
```

Result: passed, 42 tests, 42 passed.

## Not Yet Verified In Browser

- Autoplay restriction behavior after page load and user gesture.
- Delayed or missing `speechSynthesis` voices.
- Background tab behavior.
- Mute persistence across refresh.
- Weather transition audibility in a real browser.
- Interaction between ambience beds and TTS/narration.

## Current Gate Boundary

The audio-focused tests are green, and escalated `npm run harness:check` passed after the default sandbox run hit localhost `EPERM`. This page still does not claim browser audio compatibility or public readiness.

## No Paid Audio Dependency

The implementation uses only browser synthesis and existing soundscape metadata. There are no new media files, no network audio fetches, and no paid service integration.
