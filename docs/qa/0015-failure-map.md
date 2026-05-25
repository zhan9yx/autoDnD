# 0015 Failure Map

Worker: AH
Date: 2026-05-25
Scope: failed test name to file and ownership-domain mapping only. No code or test changes.

## Source Lookup

Command used:

```bash
rg -n "0015 automated browser QA flow closes fresh room, market/backpack, action, replay, and refresh recovery|0013 auth session flow registers, logs in, refreshes, and reopens a room with the same account identity|0013 password and host-approval rooms close the access-controlled entry flow before seating players|API gameplay loop keeps room creation, seat binding, turn guidance, inventory, market, and logs closed|release gate API closes static, auth, market, bag, action, audio, and replay loop|server static errors distinguish missing and permission-denied files while GET health remains authoritative|server routes expose market, buy, sell, memo, and item-use flows" tests docs scripts src public package.json
```

Results:

| Failed test name | File and line | Primary surface | Possible responsible worker | Same-source likelihood |
| --- | --- | --- | --- | --- |
| `0015 automated browser QA flow closes fresh room, market/backpack, action, replay, and refresh recovery` | `tests/browserAutomation.test.js:67` | Server-backed browser QA contract: static serving, room create/join/start, market buy, backpack refresh, chat/action, replay, room reload/recovery. | AB if AB owns browser automation or fresh-browser recovery; AF if the observed failure is only spawned-server readiness under full concurrency. | High with release/API gameplay failures if the failure is server startup or route timeout. Medium with market/inventory route failures if assertions fail after startup. |
| `0013 auth session flow registers, logs in, refreshes, and reopens a room with the same account identity` | `tests/flowClosureExtended.test.js:17` | Auth register/login/session restore, auth-owned room creation, account identity preserved on room reopen and start. | AC if AC owns auth/session and room ownership. | Medium with release gate auth assertions. Low with pure market/static assertions unless all fail at `startServer()`. |
| `0013 password and host-approval rooms close the access-controlled entry flow before seating players` | `tests/flowClosureExtended.test.js:110` | Protected-room access: password required/invalid/accepted, host-approval pending, approval/reject, pending user not seated. | AD if AD owns password and host-approval room access. | Medium with auth/session failure through shared room access and token/header paths. High if both fail at server startup. |
| `API gameplay loop keeps room creation, seat binding, turn guidance, inventory, market, and logs closed` | `tests/flowClosureExtended.test.js:337` | End-to-end API gameplay: room create/load/join/start, turn ownership, market buy failure/success, inventory, logs, secret redaction. | AE if AE owns gameplay/economy API behavior; AF if this is one of the full-concurrency timeout victims. | High with `server routes expose market...` and release gate flow because all exercise market/inventory/action/log contracts. |
| `release gate API closes static, auth, market, bag, action, audio, and replay loop` | `tests/releaseGateFlow.test.js:16` | Broad release gate: static assets, health, TTS providers, soundscapes, auth persistence, room create/join/start, market/backpack, action, audio, replay. | AF as release-gate/convergence owner; coordinate with AC for auth and AE for market/inventory/action if assertion-specific. | High with most rows because it is an aggregate coverage test. Treat as downstream unless it exposes a unique failure. |
| `server static errors distinguish missing and permission-denied files while GET health remains authoritative` | `tests/serverRoutes.test.js:14` | Server static handler and health routing: GET health, HEAD health behavior, missing static 404, permission denied 403 under `AIDM_PUBLIC_DIR`. | AF if AF owns server routing/static convergence; otherwise the server-route owner. | Low with market/auth assertion failures. High with all server-backed tests if the real symptom is spawned-server readiness or port/listen failure. |
| `server routes expose market, buy, sell, memo, and item-use flows` | `tests/serverRoutes.test.js:47` | Server route contract for market listing, buy/sell, memo, item use, economy transcript deltas, media logs, token rejection. | AE if AE owns market/backpack/economy routes. | High with API gameplay and release gate market/backpack/action sections. Medium with browser automation market/backpack flow. |

## Probable Clusters

1. Spawned-server or full-concurrency readiness cluster: all seven tests import `spawn` or start local HTTP servers. Worker AG recorded prior timeouts in `tests/browserAutomation.test.js`, `tests/flowClosureExtended.test.js`, `tests/releaseGateFlow.test.js`, and `tests/serverRoutes.test.js`. If current failures show timeout before the first assertion, route-domain ownership should yield to one shared server-start/concurrency owner, likely AF.

2. Market/backpack/economy cluster: `tests/serverRoutes.test.js:47`, `tests/flowClosureExtended.test.js:337`, `tests/releaseGateFlow.test.js:16`, and `tests/browserAutomation.test.js:67` all touch market listing, buy/sell or backpack persistence, and economy logs. If failures mention `storm-lantern`, `healing-draught`, `trail-ration`, wallet deltas, stock, item-use, or transcript economy fields, route to AE first.

3. Auth/access cluster: `tests/flowClosureExtended.test.js:17`, `tests/flowClosureExtended.test.js:110`, and the auth section inside `tests/releaseGateFlow.test.js:16` overlap on local accounts, session tokens, owner identity, room access modes, player tokens, and redaction. If failures mention `/api/auth/*`, `Authorization`, `ROOM_PASSWORD_*`, pending approvals, host tokens, or owner identity, route to AC or AD depending on whether it is account session or protected-room behavior.

4. Static/server route cluster: `tests/serverRoutes.test.js:14` is the only precise static permission-denied test. If this fails after startup with `STATIC_NOT_FOUND`, `STATIC_PERMISSION_DENIED`, `HEAD /api/health`, or `AIDM_PUBLIC_DIR`, keep it separate from market/auth workers and route to AF/server routing.

## Coordination Notes

- Do not let multiple workers patch the same shared server-start helper at once. First determine whether the failures are assertion-specific or timeouts before first response.
- Ask AB/AC/AD/AE/AF to report the first failing assertion line and response body, not only the test name. The same test names cover many domains.
- Suggested focused rerun after individual fixes, before a full suite: `node --test tests/browserAutomation.test.js tests/flowClosureExtended.test.js tests/releaseGateFlow.test.js tests/serverRoutes.test.js`.
- If all selected tests pass alone but fail in `npm run test`, treat the bug as concurrency/resource contention rather than a domain regression.
- This map is intentionally conservative: no worker is marked fixed or blocked without direct output from their lane.
