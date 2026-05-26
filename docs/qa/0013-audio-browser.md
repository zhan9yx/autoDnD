# 0013 Browser Audio Compatibility Evidence

Date: 2026-05-25 CST
Worker: F plus 0013 public-productization worker
Scope: browser audio compatibility paths. This file closes foreground live-browser audio controls only; it does not close background-tab or audible-output quality.

## Result

Status: static/unit automation plus foreground live-browser evidence.

- Autoplay restrictions: covered by contract tests. Ambience does not start automatically; it starts from the visible ambience toggle click path and calls `AudioContext.resume()` only inside `ambienceEngine.start(...)`.
- Missing Web Audio: covered by contract tests. `canUseAudio()` returns false without browser audio APIs, and the UI disables the ambience toggle with unsupported copy.
- Mute persistence: covered by contract tests. Master/music/environment volume values are clamped and persisted in `localStorage` under `aidm.ambience.volumes`.
- Delayed or missing speech voices: covered by contract tests. The voice picker registers `voiceschanged`, calls `speechSynthesis.getVoices()`, keeps stable role-profile options available before browser voices, and `selectVoice([], plan)` safely returns `null`.
- Local speechSynthesis fallback: covered by contract tests. `browser-speech-synthesis` remains the default local client provider; speaking uses `SpeechSynthesisUtterance`, falls back to the planned language when no voice exists, and uses optional browser voice assignment only when a voice is available.
- Voice mute/tuning persistence: covered by contract tests. Voice enabled state, selected voice/profile, legacy voice name, rate, and pitch are persisted locally, and stop uses `speechSynthesis.cancel()`.
- Foreground Chrome audio controls: covered by the 0013 public-productization worker. Headless Chrome reported `AudioContext=true`, `speechSynthesis=true`, 87 browser voices, ambience toggle changed to `aria-pressed=true` / `氛围开`, voice toggle changed to `aria-pressed=true` / `语音开`, and `aidm.voice.enabled=true` persisted.

## Live Browser Boundary

Foreground live-browser control evidence is now claimed for Chrome DevTools against `http://127.0.0.1:4223`.

The earlier Worker F browser tooling blocker is superseded for foreground audio controls only. Actual audible output was not measured, and this pass does not claim Safari/mobile browser voice availability.

## Background Tab Boundary

Current code does not expose an explicit background-tab compatibility handler such as `visibilitychange`-driven pause/resume, audio ducking, or speech cancellation. Browser engines may suspend Web Audio or speech while backgrounded, and this pass did not close that behavior. Keep background-tab audio compatibility open.

## Commands

- `node --check tests/audioBrowserCompatibility.test.js public/ambience.js public/tts.js public/app.js`
  - Result: passed.
- `node --test tests/audioBrowserCompatibility.test.js tests/ambienceEngine.test.js tests/publicTts.test.js`
  - Result: 17 tests total, 17 passed, 0 failed.
- `node /private/tmp/aidm-0013-public-productization-worker/0013-visible-flows.mjs`
  - Result: passed for foreground audio in the successful run recorded in `/private/tmp/aidm-0013-public-productization-worker/0013-visible-flows-summary.json`.
  - Later retry attempts to add extra post-learn spell-cast evidence hit Chrome DevTools timeout and do not supersede the successful audio evidence.

## Evidence Files

- `tests/audioBrowserCompatibility.test.js`
- Existing supporting coverage:
  - `tests/ambienceEngine.test.js`
  - `tests/publicTts.test.js`
- Live browser screenshots:
  - `/private/tmp/aidm-0013-public-productization-worker/0013-audio-05-cdp-settings-before-toggle.png`
  - `/private/tmp/aidm-0013-public-productization-worker/0013-audio-06-cdp-ambience-on.png`
  - `/private/tmp/aidm-0013-public-productization-worker/0013-audio-07-cdp-voice-on.png`
  - `/private/tmp/aidm-0013-public-productization-worker/0013-visible-flows-summary.json`

## Closure Boundary

Can treat as evidenced by static/unit automation plus foreground Chrome:

- Autoplay-safe opt-in ambience start.
- Missing Web Audio unsupported path.
- Local mute/volume persistence.
- Delayed or empty speech voice fallback.
- Local browser `speechSynthesis` fallback and stop controls.
- Foreground ambience and voice toggles are visible, clickable, and persist voice enabled state.

Must remain open:

- Background-tab behavior.
- Actual audible output quality.
- Browser-specific speech voice availability across Chrome/Safari/mobile.
- Public-readiness or launch-gate approval.
