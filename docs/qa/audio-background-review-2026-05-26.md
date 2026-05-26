# Audio Background Lifecycle Review - 2026-05-26

Worker scope: independent review of returned Audio/Voice background lifecycle changes. No product code edits, no test edits, no commit, no revert, and no historical Mencius-agent handling.

Reviewed inputs:
- `public/ambience.js`
- `public/tts.js`
- `tests/audioBrowserCompatibility.test.js`
- `tests/publicTts.test.js`
- `docs/qa/audio-background-strategy-2026-05-26.md`

## Result

Status: no obvious blocking regression found in the focused static/unit review.

The ambience path keeps the enabled intent while hidden, suspends the existing `AudioContext`, resumes only after an engine-owned background pause, and exposes `dispose()` cleanup for lifecycle listeners. The TTS path pauses `speechSynthesis` on hidden visibility, cancels on `pagehide`, and does not resume after a pagehide cancel. Those behaviors match the strategy document.

Remaining release confidence still depends on the real-browser gaps already called out in `docs/qa/audio-background-strategy-2026-05-26.md`: Chromium audible background behavior, Safari/WebKit `SpeechSynthesis.pause()` behavior, and mobile page lifecycle behavior were not proven by this worker.

## Blocking Findings

None from this focused review.

## Review Notes

- Event listener leakage: no obvious leak on the app singleton path. `createAmbienceEngine()` binds `visibilitychange`, `pagehide`, and `pageshow` once per engine instance, and `dispose()` removes the same listener references. `installSpeechSynthesisLifecycle()` also removes its listeners on `dispose()`. Tests assert listener counts return to zero for explicit dispose paths.
- Ambience hidden recovery: the active graph is not rebuilt during suspend/resume. `pauseForBackground()` leaves `enabled=true`, marks `backgroundPaused=true`, and calls `AudioContext.suspend()`. `resumeFromBackground()` requires `resumeAfterBackground`, so a stray visible/pageshow event after stop or no prior pause should not restart audio.
- SpeechSynthesis cancel/resume semantics: hidden visibility pauses active/pending speech when `pause()` exists, visible resumes only lifecycle-paused speech, and `pagehide` cancels instead of later resuming. This is consistent with the stated strategy, but it means a hidden-tab utterance is intentionally discarded if `pagehide` fires after a visibility pause.
- Auto-install side effect: `public/tts.js` now installs the speech lifecycle handler on browser import. The side effect is bounded by `defaultSpeechLifecycleController` inside the module and is a no-op without `window`, `document`, or `window.speechSynthesis`. It does mean any browser import of `tts.js` registers global speech lifecycle behavior even if voice UI is disabled.

## Suggested Follow-Ups

- Add coverage for `createAmbienceEngine().start(...)` while the document is already hidden, because that branch emits `start-hidden` before the normal `emit()` path and is not directly asserted.
- Add coverage for `AudioContext.resume()` rejection on visible/pageshow. Current `pauseForBackground()` catches `suspend()` failures, but `resumeFromBackground()` clears background flags before awaiting `resumeContext()` and does not catch resume errors.
- Add TTS coverage for browsers without `speechSynthesis.pause()` but with `cancel()`, and for speech that was already paused before the document became hidden.
- Add an auto-install-specific TTS test or documented probe so the import-time side effect is covered separately from the explicit `installSpeechSynthesisLifecycle(...)` export.
- Real-browser QA should still confirm audible Chromium behavior, Safari/WebKit speech behavior, and mobile app-switch/pagehide behavior.

## Command Results

| Command | Result |
| --- | --- |
| `node --test --test-concurrency=1 tests/audioBrowserCompatibility.test.js tests/publicTts.test.js` | Pass: 13 tests, 13 passed, 0 failed, duration 526.20925 ms. |
| `git diff --check` | Pass: no whitespace errors reported after this review document was added. |

## Files Modified By This Worker

- `docs/qa/audio-background-review-2026-05-26.md`
