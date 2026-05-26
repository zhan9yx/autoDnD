# Audio Background Browser Probe - 2026-05-26

## Scope

This pass verifies Singer's audio background lifecycle in a real local Chromium/CDP run. It does not close Mencius, does not commit, does not revert, and does not modify product code.

Only this QA note was added under the repository. The probe runner and raw output are temporary artifacts under `/private/tmp/aidm-audio-background-browser-2026-05-26/`.

## Artifacts

- Runner: `/private/tmp/aidm-audio-background-browser-2026-05-26/audio_background_browser_probe.mjs`
- Raw JSON: `/private/tmp/aidm-audio-background-browser-2026-05-26/audio-background-browser-probe.json`
- Local app URL used by the probe: `http://127.0.0.1:59039/`
- Chrome CDP port used by the probe: `59040`

## Commands

```bash
node /private/tmp/aidm-audio-background-browser-2026-05-26/audio_background_browser_probe.mjs
```

Result:

```text
ok=true
assertions=22
failed=[]
output=/private/tmp/aidm-audio-background-browser-2026-05-26/audio-background-browser-probe.json
```

```bash
node --test tests/audioBrowserCompatibility.test.js tests/publicTts.test.js tests/ambienceEngine.test.js tests/ttsProfiles.test.js
```

Result:

```text
25 passed / 0 failed / 0 skipped
```

## Browser Evidence

The probe opened the AIDM app in headless Google Chrome through CDP, with page scripts running in a real browser context. It patched the browser `AudioContext` and `speechSynthesis` methods for counters only, then loaded the app page and directly started the ambience module with a probe soundscape.

Confirmed capabilities:

- `AudioContext`: available.
- `speechSynthesis`: available.
- `SpeechSynthesisUtterance`: available.
- Runtime exceptions: none.
- Console errors captured by the probe: none.

Ambience module start:

- `createAmbienceEngine().start(...)` settled with `result=true`.
- Engine state became `enabled=true`.
- `currentSoundscapeId=browser-probe-soundscape`.
- `AudioContext` counters after start: `created=1`, `resume=1`, `suspend=0`.

Real tab background/foreground cycle:

- Before backgrounding: `visibilityState=visible`, `hidden=false`.
- After opening and foregrounding a second tab: `visibilityState=hidden`, `hidden=true`.
- Hidden tab audio counters: `resume=1`, `suspend=1`.
- Foreground return audio counters: `resume=2`, `suspend=1`.
- Hidden tab speech counters: `speak=1`, `pause=1`, `resume=0`, `cancel=0`.
- Foreground return speech counters: `speak=1`, `pause=1`, `resume=1`, `cancel=0`.

Synthetic lifecycle dispatch inside the same real Chrome page:

- `visibilitychange` hidden called `AudioContext.suspend()` and `speechSynthesis.pause()`.
- `visibilitychange` visible called `AudioContext.resume()` and `speechSynthesis.resume()`.
- `pagehide` called `AudioContext.suspend()` and `speechSynthesis.cancel()`.
- `pageshow` called `AudioContext.resume()` and did not resume canceled speech.

Final synthetic counters:

```text
AudioContext: created=1, resume=4, suspend=3, close=0
speechSynthesis: speak=1, pause=2, resume=2, cancel=1
```

## Conclusion

The Chromium/CDP lifecycle contract is closed for local browser behavior:

- A real backgrounded Chrome tab triggers the app's ambience suspend path.
- Returning to the tab triggers the ambience resume path.
- A real backgrounded Chrome tab triggers the speech pause path.
- Returning to the tab triggers speech resume when speech was lifecycle-paused.
- Synthetic `pagehide` triggers speech cancel and `pageshow` does not restart canceled speech.

## Remaining Gaps

- Actual audible quality is still an artificial/manual gap. This run used headless Chrome with muted audio, so it verifies lifecycle method calls, not what a human hears.
- Safari/WebKit `speechSynthesis.pause()` and hidden-tab queue behavior remain unverified.
- Mobile app-switch/page-freeze behavior remains unverified, especially paths that emit `pagehide` without a normal foreground `visibilitychange`.
