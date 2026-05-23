# Requirement Review

## Decision

Approved. Treat this as a product usability iteration over the existing mature table UI.

## Product Review

- The current table is visually richer, but the player still moves through a long document on mobile and can lose the action flow below secondary panels.
- Core play should be one-screen: scene, turn, latest narrative, action input, and navigation to details.
- Roster, join form, continuity, director, encounter, replay, assets, voice, and ambience are important but should not compete with the main play surface.
- Scroll is acceptable inside a modal/detail drawer when reading optional long history, but not as the main way to operate.

## Technical Review

- Use CSS layout and existing DOM before introducing new architecture.
- Add drawer state in `public/app.js`; keep state local to the browser.
- Keep the server unchanged unless smoke or tests show API needs.
- Use browser verification on mobile viewport because CSS-only regressions are common here.

## Risks

- MUST FIX: Moving controls into drawers can hide required actions if quick navigation is unclear.
- MUST FIX: Drawers must close reliably by button and Escape.
- MUST FIX: Focus and overflow cannot trap the user on mobile.
- LOW: The join form is longer than a compact drawer can show; allow internal drawer scroll only for optional setup fields.
