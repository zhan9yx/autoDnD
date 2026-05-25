# Security

## Current Boundary

AIDM has local-prototype security controls for host/player tokens, room-scoped permissions, stale version rejection, and redaction tests. These controls are useful for local-alpha review, but they are not a production security program.

## Local Executable Controls

The current server enforces these local controls so regressions are caught before public-readiness review:

- host, player, pending-player, and account-session credentials are room scoped;
- successful account registration and login return a session token once, while `/api/auth/session` returns only non-token session metadata;
- logout revokes the supplied local account session token without claiming device-wide session management;
- protected room reads return a lobby-only view unless the request proves host, approved-player, or pending-player access;
- error responses redact sensitive key names and common `key=value` secret patterns before returning supportable JSON;
- local in-memory abuse buckets throttle auth attempts, room creation, join attempts, room mutations, and SSE connections.

The local throttle is intentionally process-local and tunable for tests with `AIDM_ABUSE_LIMIT`, `AIDM_ABUSE_WINDOW_MS`, or `AIDM_ABUSE_DISABLED=1`. It is a development guard, not a distributed production rate-limit system.

## Session Rotation Contract

The local account contract is narrow:

- register and login mint new session tokens;
- session reads refresh `lastSeenAt` but do not expose or rotate the token;
- logout deletes the supplied token hash;
- multiple login tokens can coexist until an explicit logout removes one.

Production readiness still requires a reviewed identity provider, device-session policy, forced rotation rules, recovery flow, revocation scope, and audit logging before `GATE-005` can pass.

## Public-Readiness Security Gate

`GATE-005` in `docs/RELEASE_GATES.md` is blocked until the project has evidence for:

- production identity provider selection and review;
- session rotation, revocation, recovery, and device-session policy;
- API and join-flow rate limits;
- abuse throttling for room creation, password attempts, AI calls, and SSE usage;
- secret handling and environment validation;
- sensitive-data redaction proof for logs, snapshots, and support artifacts;
- accepted residual-risk list with owner and expiration.

Local evidence for Worker E-0016 is tracked in `docs/qa/0016-security-privacy.md`. That artifact is a checklist and boundary record only; it does not close `GATE-005`.

## Current Non-Claims

Passing local unit tests or Harness checks does not prove production security readiness. No public deployment should be exposed until `GATE-005` and the related legal/privacy, operations, deployment, load, and support gates pass.

Security evidence is also not legal or IP clearance. External rules, settings, names, art, audio, or lore still require the source registry, license, attribution, privacy, and legal-review evidence tracked under `GATE-006`.
