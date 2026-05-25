# 0014 Localization Leak Check

Date: 2026-05-25

Worker: AIDM 0014 parallel worker L

Scope: Chinese player-surface raw id, debug English, and readiness-claim consistency QA. This pass did not edit `public/` or `src/`.

## Commands

```bash
git status --short
rg -n -i "spell id|item id|Weather matched|director beat|Threat|Clues|No report yet|\bHuman\b|\bWarrior\b" public src tests docs README.md .harness
rg -n -i "spell id|item id|Weather matched|director beat|Threat|Clues|No report yet|\bHuman\b|\bWarrior\b" tests/bilingualUi.test.js tests/localization.test.js tests/logTemplates.test.js tests/stateSummary.test.js public/index.html public/i18n.js public/app.js src/core/localization.js src/core/logTemplates.js src/core/stateSummary.js src/core/rules.js
rg -n -i "Weather matched|director beat|spell id|item id|internal item|raw.*id|debug" tests/bilingualUi.test.js tests/localization.test.js tests/logTemplates.test.js tests/stateSummary.test.js src/core public
rg -n -i "Weather matched|director beat" public src tests docs .harness
rg -n -i 'public-ready|launch-ready|public ready|launch ready|public beta ready|public launch ready|all `REQ-281` through `REQ-400` are complete|all 400 requirements|上线就绪|可上线|可公开|发布就绪|生产就绪|ready for public|ready for launch|ready to launch|ready to ship' README.md docs .harness/changes/0014-continuous-product-depth harness.yaml
git diff -- README.md docs .harness/changes/0014-continuous-product-depth harness.yaml
node --test tests/bilingualUi.test.js tests/localization.test.js tests/logTemplates.test.js tests/stateSummary.test.js
```

Note: the working tree was already dirty before this worker wrote this file, including edits under `README.md`, `docs/`, `public/`, `src/`, and `tests/`.

## Test Result

`node --test tests/bilingualUi.test.js tests/localization.test.js tests/logTemplates.test.js tests/stateSummary.test.js` passed:

- tests: 32
- pass: 32
- fail: 0
- duration: 505.612334 ms

No first error to report.

## Localization Findings

- No current `public/`, `src/`, or focused test hit for live strings `Weather matched` or `director beat`; remaining hits are historical Harness reports/specs documenting the older issue and later fix.
- Focused tests cover the known leak classes: Chinese labels reject `Threat`, `Clues`, `No report yet`, `Human`/`Warrior` class/species leakage through dictionary/localization paths; state summary rejects raw debug ids such as `unexpected-debug-state`, `dock_enforcer_01`, `mirror-lure`, and `blood-moon-hex`; inventory log summaries reject raw item ids such as `storm-lantern`; spell learning uses player-facing spell names such as `回春短句`.
- Static grep still finds English fallback text in `public/index.html` (`Human`, `Warrior`, `Threat`, `Clues`, `No report yet`, and memo/guide fallback copy). These are initial HTML or English fallbacks, not a failing focused-test result: `public/i18n.js` has Chinese entries, `public/app.js` calls `applyTranslations`, `syncLocalizedCharacterBuilderOptions`, `syncSceneClockLabels`, and `syncReplaySummary`, and the focused tests assert those paths.
- Static grep also finds internal ids in code and data (`human`, `warrior`, `clues`, `threat`, `debug` severity, item/spell ids). They are expected implementation ids or English dictionary entries unless rendered directly. The focused tests passed for the player-visible paths checked here.

Residual QA boundary: this pass used `rg` and targeted Node tests only. It did not run a live browser visual smoke, so it does not prove absence of a pre-JavaScript English flash or every dynamic browser-only path.

## Documentation Claim Findings

- Readiness scans found no affirmative `public-ready` or `launch-ready` status claim in the changed README/Harness/status docs.
- Current matches are negative boundaries or prohibited-claim examples, including `README.md` saying the app is not public-launch ready, `docs/MATURITY_AUDIT.md` saying 0014 acceptance still would not make it public-ready, `docs/GAP_ASSESSMENT.md` requiring V5 gates before the label, and `.harness/changes/0014-continuous-product-depth/review.md` prohibiting public-ready/launch-ready claims.
- `docs/REQUIREMENTS_200.md` still contains requirement-target wording around moving toward a public-ready host and production-ready boundaries. I did not count that as a current status claim because it is a requirements ledger row, not a release-readiness assertion.

## Conclusion

For the scoped `rg` and targeted test pass, the historical Chinese-player-surface leaks are covered by current tests and the required focused test command is green. The only notable boundary is static HTML/English dictionary fallback text, which should remain covered by browser QA if a future worker performs live visual verification.
