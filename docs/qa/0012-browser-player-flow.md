# 0012 Browser Player Flow QA

Date: 2026-05-24
Branch: `codex/0012-continuous-depth-assets`
Role: browser player-flow QA work sub-agent
Scope: player-visible browser flow only. No broad UI edits were made.

## Summary

Result: PASS with follow-up localization defects.

The current player table is clean from the requested perspective: I did not find a raw asset gallery, asset-management surface, GM/director drawer, admin surface, or internal `catalog-internal` exposure in the player UI. Character creation is visible only during lobby seating and becomes hidden after joining/starting. In-game settings owns the language, ambience volume, environment/music mix, voice profile, voice toggle, read-latest, stop, rate, and pitch controls. Backpack, market, chat, dice, state, party, and full log surfaces were reachable in the browser walkthrough.

Open follow-ups are localized copy issues in the Chinese player flow, not asset/catalog leaks.

## Evidence

Local service:

- Started dev server on `http://127.0.0.1:4182`.
- `curl -sS http://127.0.0.1:4182/api/health` returned `ok=true`, version `0.11.0-production-depth`, store `json`, provider `local`.
- `npm run smoke -- http://127.0.0.1:4182` passed:
  - `roomId=room_91227c8d4ad44921`
  - `assetCount=82`
  - `generatedAssetCount=748`
  - `language=zh`
  - `marketOffers=32`
  - `purchasedItem=storm-lantern`
  - `soundscape=market-city`
  - `transcript=14`
  - `replayHighlights=4`
- `npm run test -- tests/playerUiAccess.test.js tests/staticUiStructure.test.js tests/noScrollUi.test.js` ran the package test script and passed `195/195` tests.

Browser walkthrough:

- Browser URL: `http://127.0.0.1:4182/?room=room_c8dc0435ec084b1b`.
- Created Chinese room `0012 浏览器玩家 QA`.
- Joined from player setup as `QA 玩家` / `雨档案调查员`, species `精灵`, class `法师`.
- Started scene from lobby.
- Bought `暴风提灯` from market; wallet changed from `120 克朗` to `40 克朗`.
- Opened character drawer; backpack showed `旅行提灯`, `现场札记`, `橡木杖`, `旅行长袍`, and purchased `暴风提灯`; item detail exposed `使用` disabled and `出售` enabled for the lantern.
- Submitted action `仔细检查西侧台阶寻找银账本线索`; dice panel showed landed total `27`, `1d20+7`, DC `12`, and success margin.
- Switched to chat mode and sent party chat; dice panel stayed unchanged and transcript entry had `channel=party`.
- Opened state drawer; summary showed objective, clue/threat/deadline clocks, quest progress, encounter enemy, tactical intent, rewards, replay area, and scene/media changes.
- Opened party drawer and full log drawer; roster/status and transcript were readable.
- Browser console `warn/error` log collection returned `[]`.

Clean-surface checks:

- Runtime blocked-term scans across lobby, scene, settings, market, character, state, party, and log found no visible `Asset Library`, `资产库`, `asset-grid`, `raw asset`, `catalog-internal`, `后台`, `管理后台`, `Director`, or `导演推进`.
- Drawer inventory stayed player-scoped: available drawers were `party`, `character`, `market`, `state`, `settings`, and `log`.
- Settings drawer contained market/guide plus table language, ambience controls, voice controls, and audio sliders; it did not contain `#joinForm`.
- Topbar did not contain voice/ambience sliders; those controls were in the settings drawer.

## Findings

| ID | Priority | Area | Finding | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| BPF-001 | P2 | Chinese replay/status | Chinese state drawer still exposes English replay copy. Before building replay, the state drawer showed `No report yet.`; after building replay, share copy included `1 players reached round 2` even though stats were localized as `2 章 / 2 个高光 / 1 条记忆`. | Browser state drawer on `room_c8dc0435ec084b1b`; hardcoded fallback at `public/index.html:324`; replay rendering at `public/app.js:1389-1424`; localized strings exist in `public/i18n.js:613-614`. | Replace the static HTML fallback with `data-i18n` or call replay sync after language settles, and make replay share copy consistently use the table language. |
| BPF-002 | P2 | Chinese character creation transcript | Archetype is still stored/rendered as raw English in Chinese flow. Join transcript showed `定位为Investigator`. | Browser transcript after join; raw options at `public/index.html:157-161`; Chinese join template interpolates raw `archetype` at `src/core/localization.js:54`. | Give archetypes stable ids plus localized labels, and render localized archetype names in join transcript and character creation. |

## Requested Coverage Matrix

| Requirement | Result | Evidence |
| --- | --- | --- |
| No raw asset gallery | Pass | No asset-grid/gallery terms in runtime scans; `tests/playerUiAccess.test.js` also asserts no `assetGrid`, `assetSearch`, `assetCategoryFilter`, `assetShowAll`, or `assetDetail`. |
| No operations/internal catalog exposure | Pass | No `catalog-internal`, admin, backend, or GM/director terms visible in player drawers; generated/internal catalog references only appeared in docs/tests/core assets during `rg`, not as player UI. |
| Character creation only during entry/create | Pass | Lobby `#playerSetupPanel` visible before join; after join/start: `setupHidden=true`, computed display `none`, `visibleJoinForm=false`, and settings drawer `joinFormInside=false`. |
| Settings drawer contains volume, voice, language, ambience | Pass | Settings controls visible: `#languageSelect`, `#ambienceToggle`, `#ambienceMaster`, `#ambienceMusic`, `#ambienceEnvironment`, `#voiceToggle`, `#readLatestButton`, `#stopVoiceButton`, `#voiceSelect`, `#voiceRate`, `#voicePitch`. |
| Backpack reachable | Pass | Character drawer opened; inventory list and lantern item detail rendered with sell/use state. |
| Market reachable | Pass | Market drawer opened; 32 offers rendered; `storm-lantern` purchase succeeded. |
| Chat reachable | Pass | Chat intent changed hint/placeholder, sent party chat, and did not change latest dice result. |
| Dice reachable | Pass | Action produced visible landed dice panel with total, formula, DC, and margin. |
| Status reachable | Pass | State drawer rendered objective, clocks, quest progress, encounter, rewards, replay, and media/route updates. |

## Notes

- I did not add new changes to `tests/playerUiAccess.test.js` in this pass. The existing static assertions already cover the requested no-gallery/no-admin/no-director/settings-drawer/character-setup constraints, and the browser pass provided runtime evidence for the player flow.
- The local smoke run required elevated localhost access because the sandboxed Node process hit `connect EPERM` against `127.0.0.1:4182`.
