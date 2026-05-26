# Test Report

Status: focused mobile density polish complete.

## Browser Evidence

- Reference issue screenshot: `/private/tmp/aidm-0015-consolidated-browser-final3/17-mobile-main.png`
- Final live screenshot: `/private/tmp/aidm-0017-mobile-log-toast-density/mobile-after-final-v5.png`
- Viewport: 390x844 through isolated headless Chrome DevTools.
- Seeded room: `room_88b05070cd7744d0` on local port `4205`.

## Live Metrics

- `innerWidth`: 390
- `innerHeight`: 844
- `logDensity`: `summary`
- Rendered main log rows: 12
- Recent summary row height: 34px
- Reward toast rect: x 92, y 639, w 292, h 73
- Action form rect: x 9, y 714, w 372, h 105
- Toast/action overlap: false
- Toast text: `已入背包。`

## Commands

```bash
node --check public/app.js
node --check public/i18n.js
node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js
npm run harness:status
git diff --check
```

## Results

- `node --check public/app.js`: passed.
- `node --check public/i18n.js`: passed.
- `node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js`: passed, 10 tests passed, 0 failed.
- `npm run harness:status`: passed; this change reported 13/13 tasks complete after final checklist update.
- `git diff --check`: passed.
