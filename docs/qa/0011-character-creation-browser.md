# 0011 Character Creation Browser Evidence

Date: 2026-05-25

Scope: 0011 P1 browser verification that character creation is card-first, localized, and not confusing when native species/class selects are present.

## Environment

- Dev server: `http://127.0.0.1:4208`
- Data file: `/private/tmp/aidm-0011-character-creation-browser.json`
- Browser runner: headless Google Chrome via CDP
- Evidence output: `/private/tmp/aidm-0011-character-creation-browser/`
- Script: `/private/tmp/aidm-0011-character-creation-browser-run.mjs`

## Evidence

Generated files:

- `/private/tmp/aidm-0011-character-creation-browser/report.json`
- `/private/tmp/aidm-0011-character-creation-browser/report.md`
- `/private/tmp/aidm-0011-character-creation-browser/zh-dom-sidecar.json`
- `/private/tmp/aidm-0011-character-creation-browser/en-dom-sidecar.json`

Screenshots:

- `/private/tmp/aidm-0011-character-creation-browser/zh-01-setup-initial.png`
- `/private/tmp/aidm-0011-character-creation-browser/zh-02-mage-starting-spells.png`
- `/private/tmp/aidm-0011-character-creation-browser/zh-03-warrior-specialization.png`
- `/private/tmp/aidm-0011-character-creation-browser/zh-04-joined-summary.png`
- `/private/tmp/aidm-0011-character-creation-browser/en-01-setup-initial.png`
- `/private/tmp/aidm-0011-character-creation-browser/en-02-mage-starting-spells.png`
- `/private/tmp/aidm-0011-character-creation-browser/en-03-warrior-specialization.png`
- `/private/tmp/aidm-0011-character-creation-browser/en-04-joined-summary.png`

## Result

`/private/tmp/aidm-0011-character-creation-browser/report.json` ended with `issues=[]`.

Verified in Chinese:

- Species and class card grids render before the native selects.
- Card click syncs native select values: `species=elf`, `class=warrior`.
- Mage starting spell cards show `起始已学` and `data-spell-availability="starting-available"`.
- Warrior specialization cards are visible; clicking `狂战士` syncs `specializationId=berserker`.
- Join payload includes `species=elf`, `classId=warrior`, `specializationId=berserker`.
- Room snapshot character summary confirms `species=elf`, `classId=warrior`, specialization `berserker` / `狂战士`.

Verified in English:

- Species and class card grids render before the native selects.
- Card click syncs native select values: `species=elf`, `class=warrior`.
- Mage starting spell cards show `KNOWN AT START` and `data-spell-availability="starting-available"`.
- Warrior specialization cards are visible; clicking `Berserker` syncs `specializationId=berserker`.
- Join payload includes `species=elf`, `classId=warrior`, `specializationId=berserker`.
- Room snapshot character summary confirms `species=elf`, `classId=warrior`, specialization `berserker` / `Berserker`.

## Commands

- `PORT=4208 AIDM_DATA_FILE=/private/tmp/aidm-0011-character-creation-browser.json npm run dev` passed; server listened on `http://localhost:4208`.
- `node /private/tmp/aidm-0011-character-creation-browser-run.mjs` passed; generated 8 screenshots, 2 DOM sidecars, and report JSON with `issues=[]`.
- `node --test tests/staticUiStructure.test.js tests/bilingualUi.test.js tests/playerUiAccess.test.js tests/rules.test.js` passed: 34/34.

## Limits

This closes the scoped 0011 character-creation browser verification item only. It does not claim consolidated browser acceptance, mobile viewport acceptance, public readiness, progression-loop browser QA, or 0013 spell/warrior full browser-flow closure.
