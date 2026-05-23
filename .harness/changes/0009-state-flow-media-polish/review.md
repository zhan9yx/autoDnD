# Requirement Review

Approved with constraints.

- State refinement must reduce cognitive load, not add a monitoring dashboard.
- The player should see outcomes and pressure in table language, while internal director directives remain hidden.
- Media checks should be deterministic enough for local tests: no paid model, no network dependency, no browser-only assertions for core behavior.
- If product/UIUX sub-agents identify broader launch issues, only implement the thin slice that is testable and valuable in this change.

Sub-agent review outcomes converted into scope:

- Product: reduce player UI noise, prevent keyword-only scene jumps, and require reward sources.
- UI/UX: fix drawer close residue, make state visibility compact, avoid reward toast overlap, and improve Chinese player-facing copy.
- Test/Eval: add public TTS, WebAudio ambience, static UI, state summary, reward-source, scene-coherence, and narrative guardrail tests.
