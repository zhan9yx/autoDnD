# Security

## Current Boundary

AIDM has local-prototype security controls for host/player tokens, room-scoped permissions, stale version rejection, and redaction tests. These controls are useful for local-alpha review, but they are not a production security program.

## Public-Readiness Security Gate

`GATE-005` in `docs/RELEASE_GATES.md` is blocked until the project has evidence for:

- production identity provider selection and review;
- session rotation, revocation, recovery, and device-session policy;
- API and join-flow rate limits;
- abuse throttling for room creation, password attempts, AI calls, and SSE usage;
- secret handling and environment validation;
- sensitive-data redaction proof for logs, snapshots, and support artifacts;
- accepted residual-risk list with owner and expiration.

## Current Non-Claims

Passing local unit tests or Harness checks does not prove production security readiness. No public deployment should be exposed until `GATE-005` and the related legal/privacy, operations, deployment, load, and support gates pass.

Security evidence is also not legal or IP clearance. External rules, settings, names, art, audio, or lore still require the source registry, license, attribution, privacy, and legal-review evidence tracked under `GATE-006`.
