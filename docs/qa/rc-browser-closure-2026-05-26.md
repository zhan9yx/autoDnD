# RC Browser Closure - 2026-05-26

Worker: RC Browser Closure worker
Scope: current `main` after generated PNG Git cleanup. This file is a runbook and readiness-prep record, not a public-launch approval.

## Guardrails

- Do not handle or close historical Mencius agents.
- Do not commit, revert, or edit product code from this worker.
- Only this file may be changed for this worker.
- Generated PNG payloads are local or external binary payloads. The RC browser pass must not depend on those PNG files being tracked by Git.

## Current Main Preflight

Current checked state before this QA file:

```text
branch: main
HEAD: 6ec51cf chore: keep generated raster payloads out of git
git status --short: clean
git ls-files 'assets/generated/**/*.png' | wc -l: 0
```

Ignored local payload spot check:

```text
!! assets/generated/.DS_Store
!! assets/generated/icons/aidm-action-icon-042-01.png
!! assets/generated/icons/aidm-action-icon-042-02.png
...
```

Harness status on current `main`:

```text
AIDM Harness: 25 change(s)
0011-production-depth: 67/69 tasks complete
0012-continuous-depth-assets: 43/47 tasks complete
0013-public-productization: 33/38 tasks complete
0014-continuous-product-depth: 19/23 tasks complete
0015-continuous-hardening: 23/29 tasks complete
0016-gate-evidence-index: 9/11 tasks complete
0018-missing-asset-prompts: 13/18 tasks complete
0019-missing-asset-generation: 1/16 tasks complete
0020-asset-prompt-expansion: 12/18 tasks complete
```

Automated browser contract rerun:

```bash
npm run test:browser-qa
```

Result:

```text
tests 3
pass 3
fail 0
skipped 0
duration_ms 6148.440667
```

Covered by this command:

- Static browser QA contract for drawers, refresh storage, protected-room UI hooks, audio controls, and mobile no-overflow hooks.
- Fresh room API/browser-contract flow for market, backpack, action, replay, and refresh recovery.
- Password-room and host-approval pending/approve/reject/refresh contract coverage.

Not covered by this command:

- Fresh visible desktop screenshots on the current RC.
- Fresh visible 390px and 430px mobile screenshots on the current RC.
- Real audio output quality, Safari/mobile speech matrix, and background-tab audio behavior.
- Pixel/visual inspection for density, overlap, broken-image placeholders, and drawer ergonomics.

## Historical Evidence To Reuse Carefully

Useful prior evidence:

```text
docs/qa/0015-consolidated-browser-acceptance.md
/private/tmp/aidm-0015-consolidated-browser-final3/summary.json
/private/tmp/aidm-0015-consolidated-browser-final3/*.png
```

The 0015 pack passed with:

```json
{
  "ok": true,
  "screenshots": 30,
  "assertions": 22,
  "rooms": {
    "open": "room_52bb41d1fcbf407f",
    "password": "room_0d580bd3f3ba46a1",
    "approval": "room_99a942f13d2d4f59"
  }
}
```

Do not treat the 0015 pack as the current RC closure by itself. It predates the current `main` cleanup commit and should only seed the next run's scenario list and screenshot naming.

## RC Execution Command Plan

Use isolated storage:

```bash
mkdir -p /private/tmp/aidm-rc-browser-closure-2026-05-26
PORT=4246 AIDM_DATA_FILE=/private/tmp/aidm-rc-browser-closure-2026-05-26/store.json npm run dev
```

Open:

```text
http://127.0.0.1:4246/
```

Evidence directory:

```text
/private/tmp/aidm-rc-browser-closure-2026-05-26/
```

If the temporary CDP runner from the 0015 pack is still available, it can be reused as a starting point after confirming it targets the new base URL and evidence directory:

```bash
AIDM_EVIDENCE_DIR=/private/tmp/aidm-rc-browser-closure-2026-05-26 \
AIDM_BROWSER_BASE_URL=http://127.0.0.1:4246 \
node /private/tmp/aidm-0015-consolidated-browser/cdp-runner.mjs
```

If that runner is unavailable or stale, use the Codex in-app Browser or a fresh `/private/tmp` runner. Do not add browser automation files to the repo in this worker.

## Required Viewports

Run the same scenario matrix at these widths:

| Viewport | Minimum Evidence |
| --- | --- |
| Desktop, 1365px or wider | Full flow, state/log/character/market/settings drawers, no horizontal overflow. |
| Mobile 390px | Main table, compact state strip, party rail, log drawer, market drawer, action composer, room access panels. |
| Mobile 430px | Same as 390px, with focus on button wrapping, toast/log density, state strip expansion, and drawer safe areas. |

## Required Room Modes

| Room Mode | Required Flow |
| --- | --- |
| Open room | Register/login host, create room, join at least three players/contexts, start scene, chat, action, scene switch, market/backpack, refresh recovery. |
| Password room | Create password-protected room, wrong-password feedback, correct-password join, seated refresh recovery, token/hash not visible. |
| Host approval room | Create approval room, pending player blocked from player-only actions, host queue visible, reject one request, approve one request, approved-player refresh recovery. |

## Required Functional Coverage

### Account And Session

- Register host account through visible UI.
- Refresh and verify signed-in state persists.
- Create or join room after refresh without re-entering hidden tokens.
- Verify room-scoped host/player/pending sessions recover after page reload.

### Scene And Action Loop

- Start scene from host context.
- Submit one chat and verify it does not advance the active turn.
- Submit one active-player action and verify dice/GM/log evidence appears.
- Trigger at least one scene switch with text such as market, forest, tavern, dungeon, camp, or storm.
- Verify scene title/location/objective, stage image/fallback, visual chips, soundscape label, state drawer, and log transcript describe the same scene.

### UI Density

- Situation page/table state strip can collapse/expand without overlapping the stage or action composer.
- Party rail remains compact with at least three visible players and clear local/active labels.
- Full log drawer shows multiple complete rows without one-row-only density.
- Toast/reward messages do not cover drawer controls on desktop or mobile.
- Drawers restore focus and close cleanly through button and scrim paths.

### Character, Backpack, Market

- Character drawer shows class, specialization, progression, wallet, equipment, backpack, and learned/available powers.
- Market drawer lists offers with price, stock, disabled reasons, and art/fallback.
- Buy an affordable item, verify wallet changes and item appears in backpack.
- Use, equip, or sell only if the item detail exposes the action.
- Refresh and verify wallet, inventory, equipped state, stock, transcript, and active player persist.

### Spell And Warrior Minimum Flow

- Create or join one mage-style character and verify starting spell cards are visible.
- Verify a scroll or spell-learning item is visible in market/backpack when available.
- Use a scroll if available and verify learned-spell binding updates in character/progression UI.
- Create or join one warrior character and verify specialization choices include Weapon Master, Dual Wielder, and Berserker.
- Submit one warrior action and verify combat/tactical transcript guidance is player-facing.

### Audio Settings

- After a user gesture, toggle ambience on and off.
- Adjust Master, Music, and Environment sliders.
- Toggle voice and select a voice profile if available.
- Refresh and verify mute/volume/voice preferences persist.
- Record whether the browser exposed Web Audio and `speechSynthesis`.
- Do not claim actual audible quality unless the runner or human QA directly verifies sound output.

### Console, Network, And Broken Images

- Collect console errors, page exceptions, and failed network requests per page/context.
- Accept expected wrong-password `403` and stale-version/retry `409` only when the UI recovers and the report labels them expected.
- Treat missing app assets, 5xx responses, uncaught exceptions, blocked navigation, or blank stage as blockers.
- Sweep rendered images and CSS backgrounds for broken generated payload references. Fallbacks are acceptable only when visibly intentional and not blank.

## Screenshot Naming Contract

Save fresh RC screenshots under:

```text
/private/tmp/aidm-rc-browser-closure-2026-05-26/
```

Required minimum names:

```text
00-desktop-gateway.png
01-desktop-host-registered.png
02-desktop-open-room-created.png
03-desktop-three-player-party-rail.png
04-desktop-scene-started.png
05-desktop-chat-submitted.png
06-desktop-action-submitted.png
07-desktop-scene-switched.png
08-desktop-state-strip-expanded.png
09-desktop-state-drawer.png
10-desktop-full-log-drawer.png
11-desktop-character-backpack.png
12-desktop-market-before-buy.png
13-desktop-market-after-buy.png
14-desktop-refresh-recovered.png
15-desktop-audio-settings.png
16-mobile-390-main.png
17-mobile-390-state-expanded.png
18-mobile-390-log-drawer.png
19-mobile-390-market-drawer.png
20-mobile-430-main.png
21-mobile-430-state-expanded.png
22-mobile-430-log-drawer.png
23-mobile-430-market-drawer.png
24-password-room-created.png
25-password-wrong-feedback.png
26-password-correct-seated.png
27-password-refresh-recovered.png
28-approval-room-created.png
29-approval-pending-player.png
30-approval-host-queue.png
31-approval-rejected-player.png
32-approval-approved-player.png
33-approval-approved-refresh.png
34-spell-flow.png
35-warrior-flow.png
36-broken-image-sweep.png
```

## Report JSON Contract

Write a machine-readable report beside the screenshots:

```text
/private/tmp/aidm-rc-browser-closure-2026-05-26/summary.json
```

Minimum shape:

```json
{
  "ok": false,
  "baseUrl": "http://127.0.0.1:4246",
  "head": "6ec51cf",
  "evidenceDir": "/private/tmp/aidm-rc-browser-closure-2026-05-26",
  "rooms": {
    "open": null,
    "password": null,
    "approval": null
  },
  "screenshots": [],
  "assertions": [],
  "consoleErrors": [],
  "networkFailures": [],
  "brokenImages": [],
  "blockers": []
}
```

Set `ok: true` only if every required flow passes, screenshots exist, no blocker remains, and generated PNG Git tracking is not required.

## Closure Criteria

The RC browser closure can be marked passed only when all of these are true:

- `git ls-files 'assets/generated/**/*.png' | wc -l` remains `0`.
- `npm run test:browser-qa` passes on current `main`.
- Fresh visible screenshot pack exists for desktop, 390px mobile, and 430px mobile.
- Open, password, and host-approval room flows pass on fresh isolated data.
- Register/login/session restore and room-scoped refresh recovery pass.
- Scene switch, action turn, chat non-turn, state/log/party/character/backpack/market/audio settings are verified in browser.
- Spell and warrior minimum flows have browser evidence.
- Console/network/broken-image sweep has no unhandled blocker.
- Any expected 403/409/404 entries are explained and visibly recovered.

## Current Blocking Issues From This Worker

No new product bug was reproduced by this worker.

Current blocker for RC browser closure:

- Fresh visible desktop/390px/430px RC screenshot pack has not been executed in this worker.
- Historical 0015 screenshots are useful but cannot be the final RC proof for `6ec51cf`.
- Actual audible output, Safari/mobile voice matrix, and background-tab audio behavior remain outside the automated evidence captured here.

## Files Changed

- `docs/qa/rc-browser-closure-2026-05-26.md`
