# Quality Gates

## Per Change

- Requirement review exists and names concrete acceptance criteria.
- Tests cover deterministic rules or state transitions touched by the change.
- `npm run test` passes.
- `npm run lint` passes.
- `npm run eval:memory` passes for long-history retrieval.
- `npm run harness:check` passes.
- `test-report.md` records commands and results.

## Release Readiness

- App boots locally from a clean checkout using only documented commands.
- No API key is required for demo mode.
- OpenAI usage is optional and configured by environment variables.
- State can survive a server restart through `AIDM_DATA_FILE`.
- Browser room updates are real-time enough for multiple tabs through SSE.

## Escalation

If a requirement review loops more than 3 times, or implementation review loops more than 2 times, stop and ask for a human decision before continuing.
