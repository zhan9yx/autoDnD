# 0012 Player Flow QA

Date: 2026-05-24
Branch: `codex/0012-continuous-depth-assets`
Role: player-flow QA sub-agent

## Scope

This pass reviewed the current player-visible flow only: main table, character creation, settings, character/status/inventory/market drawers, action/chat controls, dice feedback, scene movement surface, and audio/voice feedback controls.

Out of scope: generated asset provenance, backend architecture documentation, admin or asset-management workflows.

## Evidence

- Static code review: `public/index.html`, `public/app.js`, `public/i18n.js`, `src/core/stateMachine.js`, `src/core/gameEngine.js`, `src/core/localization.js`, `src/core/replay.js`, and player-flow tests.
- Automated tests:
  - `npm run test`: 195 passed, 0 failed.
  - `npm run smoke`: first sandboxed run failed with localhost `EPERM`; rerun with localhost access passed.
  - Smoke pass summary: `room_9a26d78aa0d64104`, `language=zh`, `marketOffers=23`, `purchasedItem=storm-lantern`, `soundscape=market-city`, `transcript=14`, `replayHighlights=4`.
- Local runtime review:
  - `GET http://127.0.0.1:4173/api/health` returned `ok=true`, version `0.11.0-production-depth`, store `json`, provider `local`.
  - Browser walkthrough on `http://127.0.0.1:4173`: created a Chinese room, joined from the player setup, started scene, submitted an action, verified dice panel, opened character/status/settings/market drawers, bought a market item, and generated a replay.

## Findings

| ID | Priority | Area | Finding | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| PF-001 | P1 | Lobby / host control | A non-host player can be shown an enabled `Begin scene` control once anyone has joined, but starting requires a host token and the click path has no visible error handling. This can make invited players think the room is broken. | `public/app.js:459-466` posts `{ hostToken }` without `try/catch`; `public/app.js:636` enables the button based only on phase/player count; `src/core/gameEngine.js:67-69` requires host access. | Disable or hide host-only start for clients without a room-scoped host token, or show an inline error on failure. Add a browser test for invitee-without-host-token in lobby. |
| PF-002 | P1 | Chinese player flow | Chinese rooms still leak untranslated or raw English into core player text. The runtime walkthrough showed `定位为Investigator`; English player action text was spliced into Chinese narration as `选择search...`; generated replay/share text remained English. | Archetype options are raw text in `public/index.html:157-162`; Chinese join template inserts raw archetype at `src/core/localization.js:53-55`; narration inserts raw action text at `src/core/localization.js:81`; replay UI renders raw `replay.shareText` at `public/app.js:1324-1327`. | Add localized archetype values/labels, quote or visually isolate raw player action text in localized narration, and localize replay title/share text for `room.language`. |
| PF-003 | P2 | Character creation | Empty player and character names submit successfully and create generic `玩家` / `冒险者` identities. This is forgiving, but easy to do accidentally because the form has no `required` fields or confirmation that defaults will be used. | Inputs lack `required` in `public/index.html:101-103`; defaults are applied in `src/core/stateMachine.js:127-150`; browser click-through with blank fields joined successfully as the default character. | Require at least one explicit displayed name, or add a deliberate "Use default adventurer" affordance. Add a browser test for empty submit behavior. |
| PF-004 | P2 | Replay / status drawer | Replay/status fallback text is not fully localized. Before building replay the Chinese state drawer can expose `No report yet.`, and after building replay the summary can show English share copy. | Hardcoded fallback in `public/index.html:319-324`; `renderReplay` uses raw `replay.title` and `replay.shareText` in `public/app.js:1319-1328`; browser state drawer showed English replay output in a Chinese room. | Use `data-i18n` for the fallback and make replay builder language-aware, or display replay copy as explicitly export-oriented English. |
| PF-005 | P2 | Time / transcript | Transcript timestamps use the browser default locale instead of the table language. This can produce inconsistent 12h/24h display across players in the same room. | `new Date(entry.createdAt).toLocaleTimeString()` in `public/app.js:1062-1064`. | Format with `Intl.DateTimeFormat` using `uiLanguage` and stable hour/minute options; add EN/ZH timestamp assertions. |
| PF-006 | P3 | Market | The market flow works, including insufficient-funds states and wallet updates, but the player sees a long unfiltered list of 23 offers inside one drawer. Repeated play will become scan-heavy. | Runtime market drawer showed 23 smoke offers and many repeated categories; `renderMarketDrawer` renders all offers without filter/search at `public/app.js:916-959`. | Consider category tabs or a compact "affordable only" toggle. Add a regression test that the long list remains navigable on mobile. |

No P0 blocker was found. The main table can be played end to end locally, and the critical deterministic tests are green.

## Positive Coverage

- Main room shell stays within a fixed table layout; drawers open over the table and restore the player to play context.
- Character sheet, wallet, equipment slots, inventory details, market wallet, and buy-disabled reasons updated correctly during the browser walkthrough.
- Dice panel produced visible rolling/landed state, final total, success/failure text, DC, expression, and margin.
- Status drawer exposed objective, clue/threat/deadline clocks, quest progress, exits, encounter state, enemy HP/defense/intent, rewards, and replay.
- Settings drawer grouped market/guide, language, ambience, and voice controls without exposing asset/admin controls.

## Suggested Test Points

1. Invitee player with no host token joins a lobby and clicks `Begin scene`; expected result should be disabled/hidden or visible error, not silent failure.
2. Empty character creation fields, over-budget attributes, min/max steppers, and keyboard-only join flow.
3. Action vs chat mode: chat should not roll dice, advance round, or overwrite action placeholder; party/public channel badges should be visible and localized.
4. Market buy, insufficient funds, repeated buys, sell from character drawer, use/equip item, stale-version error display.
5. Scene transition actions: mention route without travel intent, failed travel, successful travel to market/forest, and verify stage copy, clocks, state drawer, and soundscape reason update together.
6. Audio feedback: ambience on/off after browser autoplay unlock, stop audio, voice on/off, read latest, unsupported speech/audio browser states, and reduced-motion preference.
7. Mobile/narrow viewport: topbar controls, drawer bottom-sheet behavior, action composer, long market list, character inventory, and status/replay panels.
8. Chinese localization sweep for archetype labels, replay, timestamps, voice labels, raw user action framing, and any rule/combat terms.
