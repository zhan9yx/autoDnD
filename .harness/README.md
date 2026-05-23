# AIDM Harness

This Harness makes AI-assisted development repeatable and auditable. It keeps project rules, active changes, tests, and decisions in files so future agents do not depend on chat memory.

## Design Inputs

- Keep the top-level context short and link to deeper docs instead of placing every detail in one prompt.
- Treat tests as executable requirements, especially for AI-generated logic.
- Add hard gates around state transitions, dice math, memory updates, and multiplayer turn ownership.
- Record every change under `.harness/changes/` with requirement, review, task, and verification artifacts.

## Required Change Files

Every change directory must include:

- `spec.md`: product requirement and acceptance criteria.
- `review.md`: requirement review, risks, and approval decision.
- `tasks.md`: implementation tasks with status.
- `test-report.md`: commands run, results, known gaps.

## Commands

```bash
npm run harness:status
npm run harness:new -- <slug>
npm run harness:check
```

`harness:check` runs the local lint checks, verifies change artifacts, and runs the Node test suite.

## Rule Files

- `rules/ai-boundary.md`: what AI can and cannot control.
- `rules/state-management.md`: authoritative room state and event flow.
- `rules/cost-performance.md`: model-cost and latency controls.
- `agents/subagent-ledger.md`: parallel agent ownership and close-out tracking.
