# Test Report

## Automated Verification

- `npm run test`: passed, 58/58 tests.
- `npm run lint`: passed, 47 JavaScript files checked.
- `npm run eval:memory`: passed on the 16-hour campaign dataset, 2112 events, 256 queries, recall@5 = 1.000, MRR = 1.000.
- `npm run simulate:campaign`: passed, covering 5 players through round 6 with memory writes, combat logs, replay highlights, and revelation beat progression.
- `npm run smoke`: passed against the local server, creating a Chinese room with 82 assets, 52 generated assets, 3 TTS providers, combat resolution, replay highlights, memory writes, and director beat progression.
- `npm run harness:check`: passed after structure checks, lint, unit tests, 16-hour memory evaluation, campaign simulation, and report completeness checks.

## Browser Verification

- Opened `http://localhost:4173` in the in-app browser.
- Verified the entry page follows the selected Chinese locale with `html lang="zh-CN"`, translated title and heading, and no console errors.
- Created and loaded smoke room `room_e48a8816305d49bb`.
- Verified the room snapshot preserved `language: "zh"`.
- Verified Chinese transcript output, localized table labels, round/turn badges, and replay/status text.
- Exercised voice controls: enable read-aloud, stop playback, disable read-aloud, voice selection, rate slider, and pitch slider.
- Checked mobile viewport at 560px width with no horizontal overflow.
- Captured UI evidence at `/private/tmp/aidm-bilingual-entry.png` and `/private/tmp/aidm-bilingual-voice-room.png`.

## Notes

The shipped runtime path is browser `speechSynthesis`, so it has no paid service dependency and no mandatory model download. The self-host upgrade path is documented for eSpeak NG as the lowest-footprint open-source provider and Piper as the higher-quality local neural provider.
