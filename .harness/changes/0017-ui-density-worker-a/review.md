# Requirement Review

Decision: approved for a focused frontend product-experience batch.

## Review Summary

The change is scoped to the live table surface and supports the active acceptance gap: users need more information per screen without losing turn ownership, player state, scene context, or mobile ergonomics. The batch reuses existing scene assets and current CSS/DOM patterns rather than introducing new media.

## Approved

- Add compact party-card scene/status text.
- Add grouped transcript timeline markers.
- Convert detail-only transcript metadata into expandable rows.
- Add bilingual labels and focused static/no-scroll/player tests.
- Record focused QA evidence for this worker.

## Not Approved

- New generated or external image assets.
- Auth/audio/spell-warrior evidence edits owned by 0013 workers.
- Release readiness or gate-evidence edits owned by 0015 workers.
- Asset inventory edits owned by the asset inventory worker.

## Risks

- The worktree already contains concurrent UI and runtime edits. This pass must be reviewed as an incremental change on top of those edits, not as a clean branch diff.
- Browser evidence is useful but not a full launch gate. If the full browser run is not possible, focused DOM/static/no-scroll tests and QA notes are acceptable for this worker batch.
