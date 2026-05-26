# Audio And Voice Matrix Evidence

Date: 2026-05-26 CST
Worker scope: audio/voice evidence only. No product code changes, no commit, no revert, and no historical Mencius-agent handling.
Baseline: `main` at `d5919ee chore: close external raster release gaps`; generated PNG payloads are not tracked by Git.

## Result

Status: partial evidence pack. Static/unit coverage is green, and local headless Chrome proves the browser exposes the required audio and speech APIs. Actual audible quality, Safari/mobile behavior, and a complete visible foreground-toggle pass remain open.

## Evidence Files

- Temporary probe script: `/private/tmp/aidm-audio-voice-2026-05-26/audio_voice_cdp_probe.mjs`
- Temporary probe output: `/private/tmp/aidm-audio-voice-2026-05-26/audio-voice-cdp-probe.json`
- Existing foreground-supporting evidence: [0013-audio-browser.md](/Users/yixuan.zhang/Documents/AIDM/docs/qa/0013-audio-browser.md)

## Automated Tests

| Command | Result |
| --- | --- |
| `node --check tests/audioBrowserCompatibility.test.js public/ambience.js public/tts.js public/app.js src/core/ttsProfiles.js` | Pass. |
| `node --test tests/audioBrowserCompatibility.test.js tests/ambienceEngine.test.js tests/publicTts.test.js tests/ttsProfiles.test.js` | Pass: 21 tests, 21 passed, 0 failed. |
| `node --test tests/soundscape.test.js tests/releaseGateFlow.test.js tests/browserAutomation.test.js` | Pass: 28 tests, 28 passed, 0 failed. |
| `node --check /private/tmp/aidm-audio-voice-2026-05-26/audio_voice_cdp_probe.mjs` | Pass. |
| `AIDM_BASE_URL=http://127.0.0.1:4237 AIDM_AUDIO_PROBE_OUT=/private/tmp/aidm-audio-voice-2026-05-26 node /private/tmp/aidm-audio-voice-2026-05-26/audio_voice_cdp_probe.mjs` | Pass; wrote the JSON probe output. |
| `rg -n "visibilitychange|document\\.hidden|document\\.visibilityState|pagehide|pageshow" public src tests docs/I18N_TTS.md` | No matches; no explicit background-tab policy is implemented. |

## WebAudio Matrix

| Area | Current Evidence | Status |
| --- | --- | --- |
| WebAudio availability | Headless Chrome 148 reported `hasAudioContext=true`, `hasWebkitAudioContext=false`, secure context true, page visible. | Covered for local Chrome API availability. |
| Autoplay/user gesture contract | `tests/audioBrowserCompatibility.test.js` asserts ambience is opt-in, disabled when WebAudio is unavailable, and starts through the visible toggle path. `tests/ambienceEngine.test.js` asserts `AudioContext.resume()` is called only when `start(...)` runs. | Covered by static/unit automation. |
| Ambience volume persistence | Unit tests clamp and persist `aidm.ambience.volumes`; CDP probe persisted `{"master":0.3,"music":0.2,"ambience":0.45}`. | Covered. |
| Foreground ambience toggle | Static/unit coverage is green. The current CDP run found the control text and enabled state, but the settings-drawer button rects were `0x0` in headless Chrome, so this run does not claim a successful visible click toggle. | Still needs fresh visible-browser proof on the current RC. |
| Soundscape breadth | `tests/soundscape.test.js` passed rain, thunder, wind, clear-day, forest, archive, shrine, tavern/social, seasonal, stale-context suppression, and mismatch guards. | Covered by deterministic automation. |

## Voice Matrix

| Area | Current Evidence | Status |
| --- | --- | --- |
| `speechSynthesis` availability | Headless Chrome reported `hasSpeechSynthesis=true`, `hasSpeechSynthesisUtterance=true`. | Covered for local Chrome API availability. |
| Browser voice inventory | Headless Chrome exposed 87 voices, including a default `zh-CN` voice. The settings menu exposed 46 options: 40 role profiles and 5 compact browser voice options. | Covered for this local Chrome environment. |
| Voice profile picker | Static tests assert stable role profiles before browser voices; CDP selected `profile:aidm` and persisted `aidm.voice.selection=profile:aidm`. | Covered. |
| Rate/pitch persistence | CDP persisted `aidm.voice.rate=1.1` and `aidm.voice.pitch=0.9`; tests assert local storage writes. | Covered. |
| Speech utterance construction | CDP constructed `SpeechSynthesisUtterance`, called `speechSynthesis.speak(...)` with volume 0, then cancelled without exception. | Covered for API acceptability only. |
| Actual audible output | No microphone/device-level capture, no human listener checklist, and no quality score was produced. | Open. |

## Browser/Device Matrix

| Browser Surface | Result |
| --- | --- |
| Codex in-app browser | DOM controls were visible, but the automation evaluation environment did not expose real `navigator`, `AudioContext`, or `speechSynthesis`. This is a tooling boundary, not a product failure claim. |
| Codex Chrome Extension | `agent.browsers.get("extension")` failed twice with `Browser is not available: extension`; no extension-backed Chrome run was possible in this worker. |
| Local headless Chrome/CDP | API availability, local voice inventory, profile persistence, volume persistence, and utterance construction were captured in `/private/tmp/aidm-audio-voice-2026-05-26/audio-voice-cdp-probe.json`. |
| Safari desktop | Not executed. |
| Mobile Safari / iOS | Not executed. |
| Android Chrome | Not executed. |

## Background Tab Boundary

The CDP run opened a second tab and observed the AIDM tab become `document.visibilityState="hidden"` / `document.hidden=true`. The app currently has no `visibilitychange`, `pagehide`, or `pageshow` handler in `public` or `src`.

This means background behavior remains browser-owned. WebAudio and `speechSynthesis` may be paused, throttled, or cancelled depending on browser and OS policy. Current evidence does not prove background-tab audio continuity, graceful pause/resume, or speech cancellation behavior.

## Open Gaps

- Fresh visible-browser foreground toggle proof for ambience and voice on the current RC.
- Actual audible quality review for ambience layers: rain naturalness, thunder, wind, crowd/voice-bed clarity, volume balance, and transition smoothness.
- Actual audible quality review for TTS: Chinese and English pronunciation, per-role distinctness, rate/pitch naturalness, interruption/cancel behavior, and whether profile variation feels sufficient.
- Safari desktop and mobile Safari matrix, including empty/delayed voices and autoplay behavior.
- Android Chrome matrix.
- Background-tab policy decision: keep browser default behavior, pause ambience explicitly, or resume/retune on return.

## Recommendation

Treat this file as an Audio/Voice evidence preparation pack, not final launch approval. The next closure pass should use a visible real browser session with screenshots and a short human-listening checklist, then append results rather than editing the static/unit evidence above.
