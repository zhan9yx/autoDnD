# Audio Background Strategy - 2026-05-26

## Scope

Worker A covered the Audio/Voice background-tab lifecycle without editing `public/app.js`, because that file already has concurrent visible UI work.

## Implemented Strategy

- Ambience: `createAmbienceEngine()` now binds `visibilitychange`, `pagehide`, and `pageshow` internally.
- Ambience hidden/pagehide behavior: keep the user's enabled intent, mark `backgroundPaused`, and call `AudioContext.suspend()` without rebuilding the active graph.
- Ambience visible/pageshow behavior: resume only when the engine itself paused for background lifecycle, then reapply saved volumes.
- Ambience cleanup: `dispose()` removes lifecycle listeners and stops active nodes for tests or future teardown paths.
- TTS: `installSpeechSynthesisLifecycle()` pauses active `speechSynthesis` output on `visibilitychange` hidden, resumes only lifecycle-paused speech on visible, and cancels speech on `pagehide`.
- TTS runtime hook: `tts.js` auto-installs the lifecycle controller in browser contexts, so the existing `public/app.js` import path receives the behavior without a UI-file edit.

## Automated Evidence

- `tests/audioBrowserCompatibility.test.js` covers ambience suspend/resume behavior, active source count stability, listener cleanup, and starting while the document is already hidden.
- `tests/publicTts.test.js` covers SpeechSynthesis pause/resume/cancel decisions, listener cleanup, and the browser import auto-install path.

## Remaining Real Browser Gap

- Confirm in a real Chromium tab that hidden-tab ambience actually becomes inaudible while the tab is backgrounded and resumes after returning.
- Confirm Safari/WebKit behavior for `SpeechSynthesis.pause()` because some versions handle hidden-tab speech queues differently.
- Confirm mobile browser page lifecycle behavior, especially app switch/page freeze paths that may fire `pagehide` without a later normal `visibilitychange`.
