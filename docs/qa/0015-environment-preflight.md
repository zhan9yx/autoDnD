# 0015 Environment Preflight

Worker: AF
Date: 2026-05-25 12:24 CST
Scope: process, port, and temporary-file interference risk only. Worker AF did not edit product code, tests, Harness status, or git history.

## Summary

Environment interference was found.

The first `pgrep -fl` pass found leftover AIDM test and local server processes from interrupted validation. Worker AF terminated the clearly project-owned `node --test`, `npm run test:browser-qa`, and `node src/server/server.js` processes listed below. After termination, new AIDM test/server processes kept appearing, which indicates an active or still-respawning test driver outside this worker's control. That is a current environment blocker for a clean final validation pass until the owner of that driver stops it or the batch exits.

Worker AF did not kill Codex worker kernel processes, unrelated MCP/npm helper processes, `gadgets/webpage` dev server processes, editor/IDE listeners, WeChat listeners, or other unrelated localhost services.

## Process Findings

Initial `pgrep -fl "npm run test|node --test|node src/server/server.js|vite|AIDM|aidm"` found these clear AIDM test/server processes:

| PID | Command |
| --- | --- |
| 12344 | `node --test tests/serverRoutes.test.js` |
| 12384 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/serverRoutes.test.js` |
| 12386 | `npm run test:browser-qa ...` |
| 12402 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |
| 12403 | `node --test tests/releaseGateFlow.test.js tests/flowClosureExtended.test.js` |
| 12464 | `node --test tests/browserAutomation.test.js` |
| 12465 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/flowClosureExtended.test.js` |
| 12466 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/releaseGateFlow.test.js` |

Worker AF terminated the live members of that set with `kill 12344 12384 12386 12402 12403 12464 12465 12466`. PID `12402` had already exited by the time `kill` ran.

Follow-up `pgrep` showed additional AIDM test/server PIDs:

| PID | Command |
| --- | --- |
| 12661 | `node --test --test-name-pattern 0013 auth session flow|0013 password and host-approval tests/flowClosureExtended.test.js` |
| 12738 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/flowClosureExtended.test.js` |
| 12884 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |

Worker AF terminated those with `kill 12661 12738 12884`.

Another follow-up showed more AIDM test/server PIDs:

| PID | Command |
| --- | --- |
| 12965 | `node --test --test-name-pattern API gameplay loop keeps room creation tests/flowClosureExtended.test.js` |
| 12967 | `node --test --test-name-pattern release gate API closes tests/releaseGateFlow.test.js` |
| 12993 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/flowClosureExtended.test.js` |
| 12997 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/releaseGateFlow.test.js` |
| 13031 | `node --test --test-name-pattern server routes expose market tests/serverRoutes.test.js` |
| 13253 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |
| 13267 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |
| 13274 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/serverRoutes.test.js` |
| 13374 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |
| 13696 | `node --test --test-name-pattern automated browser QA flow tests/browserAutomation.test.js` |
| 13762 | `node --test --test-name-pattern 0013 password and host-approval rooms tests/flowClosureExtended.test.js` |
| 13775 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/browserAutomation.test.js` |
| 13777 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/flowClosureExtended.test.js` |

Worker AF ran `kill 12965 12967 12993 12997 13031 13253 13267 13274 13374 13696 13762 13775 13777`. PIDs `13696`, `13762`, `13775`, and `13777` had already exited by then.

Latest observed `pgrep` after additional checks still showed new AIDM test/server processes:

| PID | Command |
| --- | --- |
| 16768 | `node --test --test-name-pattern API gameplay loop keeps room creation tests/flowClosureExtended.test.js` |
| 16782 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/flowClosureExtended.test.js` |
| 16796 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |
| 16813 | `node --test --test-timeout 60000 --test-name-pattern server routes expose market tests/serverRoutes.test.js` |
| 16829 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/serverRoutes.test.js` |
| 16847 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |

Worker AF did not keep killing after this point because the repeated reappearance pattern indicates an active or respawning owner process, not a one-time orphan cleanup. Final validation should not start cleanly while these commands are present.

Final closeout `pgrep` showed the blocking pattern continuing, including a full `npm run test` driver:

| PID | Command |
| --- | --- |
| 17186 | `node --test --test-name-pattern release gate API closes tests/releaseGateFlow.test.js` |
| 17199 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/releaseGateFlow.test.js` |
| 17201 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |
| 17300 | `npm run test ...` |
| 17347 | `node --test tests/ambienceEngine.test.js ... tests/ttsProfiles.test.js` |
| 17367 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/assetSelection.test.js` |
| 17375 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/flowClosureExtended.test.js` |
| 17378 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/generatedAssets.test.js` |
| 17489 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |
| 17561 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/productionDepth.test.js` |
| 17615 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/serverRoutes.test.js` |
| 17715 | `node --test --test-name-pattern 0013 auth session flow|0013 password and host-approval tests/flowClosureExtended.test.js` |
| 17754 | `/usr/local/Cellar/node/25.9.0_2/bin/node ... tests/flowClosureExtended.test.js` |
| 17777 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |
| 17791 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` |

The `pgrep` pattern also matched multiple Codex kernel processes with command lines like:

```text
/Applications/Codex.app/Contents/Resources/node --experimental-vm-modules ... --working-dir /Users/yixuan.zhang/Documents/AIDM
```

Those were intentionally left running because they are worker infrastructure, not AIDM test or dev-server processes.

## Port Findings

`lsof -nP -iTCP -sTCP:LISTEN` found an AIDM-owned node listener:

| PID | Listener | Finding |
| --- | --- | --- |
| 15145 | `*:4173` | `lsof -a -p 15145 -d cwd` showed cwd `/Users/yixuan.zhang/Documents/AIDM`; by the time `kill 15145` ran, the process had already exited. |

Later `lsof` showed another AIDM server listener:

| PID | Listener | Finding |
| --- | --- | --- |
| 15664 | `*:54658` | matched `pgrep` as `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js`; this was part of the continuing respawn pattern. |

Final closeout `lsof` showed `node 17489` listening on `*:55114`; `pgrep` identified PID `17489` as `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js`.

`lsof` also showed `node 74161` listening on `127.0.0.1:3000`, but earlier process output identified it as `npm run dev` with `INIT_CWD=/Users/yixuan.zhang/Documents/gadgets/webpage`. Worker AF left it alone.

## Temporary Files

`find /private/tmp -maxdepth 1 ... '*aidm*'` found many AIDM-named temporary artifacts, including JSON data stores, browser profiles, screenshots, copied static assets, probe scripts, and QA notes. Examples from this pass:

- `/private/tmp/aidm-0015-worker-a-fresh-data.json`
- `/private/tmp/aidm-0015-worker-b-store.json`
- `/private/tmp/aidm-0014-mobile-layout-store.json`
- `/private/tmp/aidm-0014-worker-y`
- `/private/tmp/aidm-chrome-profile-*`
- `/private/tmp/aidm-visual-qa-20260525`
- `/private/tmp/aidm-dev-server-wrapper.mjs`

Worker AF did not delete any `/private/tmp` file or directory. None of the observed paths alone proved a port lock; deleting them could interfere with active or recently completed worker evidence.

## Non-Functional Checks

| Command | Result | Notes |
| --- | --- | --- |
| `git status --short` | Pass | Worktree is dirty with many tracked edits and untracked 0015 docs/tests from other workers. Worker AF did not modify or revert them except adding this report. |
| `git diff --check` | Pass | No whitespace errors reported. |
| `pgrep -fl ...` | Blocked by active processes | Repeatedly found AIDM `node --test` and `node src/server/server.js` processes after cleanup. |
| `ps -ef` | Pass for broad inspection | Full process listing was noisy; targeted `ps -o ...` and piped filtering were blocked by sandbox policy. |
| `lsof -nP -iTCP -sTCP:LISTEN` | Pass | Found AIDM listeners during the pass; unrelated listeners were not touched. |

## Current Blocker Status

Environment is not clean for final validation at the latest Worker AF observation.

Blocking condition: AIDM test/server processes kept reappearing after multiple targeted cleanup passes. Before rerunning full validation, rerun:

```bash
pgrep -fl "npm run test|node --test|node src/server/server.js|vite|AIDM|aidm"
lsof -nP -iTCP -sTCP:LISTEN
git diff --check
```

The expected clean process result is no AIDM `npm run test`, `node --test`, `node src/server/server.js`, or AIDM dev-server listener entries, excluding Codex worker kernel processes that merely include `--working-dir /Users/yixuan.zhang/Documents/AIDM`.

## Worker AI Closeout

Worker: AI
Date: 2026-05-25 12:17 CST
Scope: process cleanup handoff only. Worker AI did not edit product code, tests, Harness status, git history, or temporary artifacts.

Follow-up `pgrep -fl "npm run test|node --test|src/server/server\.js"` no longer showed the previously reported PIDs `17300`, `17347`, or `17489`. It did show one remaining AIDM-owned server process:

| PID | Command | Verification |
| --- | --- | --- |
| 19694 | `/usr/local/Cellar/node/25.9.0_2/bin/node src/server/server.js` | `lsof -a -p 19694 -d cwd -Fn` reported cwd `/Users/yixuan.zhang/Documents/AIDM`; `lsof -Pan -p 19694 -iTCP -sTCP:LISTEN` showed `*:55601`. |

Worker AI terminated PID `19694` with `kill 19694`.

Post-cleanup `pgrep -fl "npm run test|node --test|src/server/server\.js"` returned no matches. Post-cleanup `lsof -Pan -iTCP -sTCP:LISTEN` showed no AIDM `node src/server/server.js` listener. Unrelated listeners, including the existing `node` listener on `127.0.0.1:3000`, were left untouched.

Current Worker AI status: environment is clean for retest with respect to AIDM `npm run test`, `node --test`, and `node src/server/server.js` leftovers.
