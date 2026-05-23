# 0003 Maturity Assets Evals

## Requirement

Raise AIDM from the current productized local build toward a mature, reviewable product track. This change must audit launch readiness honestly, expand the reusable evaluation system to a 16-hour campaign scale, introduce generated image asset ingestion using ChatGPT image generation, improve player-facing guidance, and add a larger product requirement library for future Harness-managed work.

## Acceptance Criteria

- Current maturity is re-audited and public-launch gaps are recorded.
- `docs/REQUIREMENTS_200.md` records at least 200 substantial product requirements.
- Long-history evaluation includes a 16-hour campaign-scale dataset and default quality gate.
- A generated image asset pipeline stores ChatGPT-generated image sheets and sliced transparent assets under project-managed paths.
- Asset manifests distinguish generated raster assets from code-generated SVG placeholders.
- The UI exposes a richer asset marketplace/gallery and user guidance entry points.
- Tests cover 200-requirement count, 16-hour eval shape, generated asset manifest shape, and guide artifacts.
- Harness check passes before merge.

## Non-Goals

- No public deployment or app-store submission is performed in this local iteration.
- Full 3000 image assets are not a hard gate for this single change; the pipeline must make scaling to thousands practical and auditable.
- Real payment, production auth provider, and managed database migration remain V5 launch-readiness work unless explicitly pulled into this change.
