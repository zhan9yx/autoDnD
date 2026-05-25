# 0016 Security And Privacy Boundary

## Status

Worker E-0016 adds executable local boundaries for `GATE-005 security/abuse` and `GATE-006 legal/privacy`.

Current decision: both gates remain blocked. This artifact is a template and local evidence index only. It is not a production security review, privacy policy, license clearance, or legal approval.

## Security Evidence Added

- Local abuse guard: `src/server/server.js` throttles auth attempts, room creation, join attempts, protected room mutations, and SSE connections with in-memory buckets.
- Error redaction: server error payloads redact sensitive key names and common secret assignment patterns before JSON output.
- Session contract: local account session reads expose only public session metadata; register/login mint tokens; logout revokes the supplied token only.
- Permission boundary: tests keep account-owner host access, host tokens, player tokens, and pending-player tokens scoped to the correct room and role.

## Non-Claims

- No distributed rate limiting, WAF, bot detection, production identity provider, audit logging, support workflow, or incident response coverage is claimed.
- No official DND or SRD rules text, setting text, stat blocks, names, art, audio, or lore are adopted by this artifact.
- AIDM remains an original, generic fantasy TRPG prototype for local play and QA.
- Legal clearance is not complete. Public launch remains blocked until `GATE-006` has source, license, attribution, privacy, retention, consent, deletion/export, and legal-review evidence.

## Local Source Registry Template

Use this registry before any external rules, setting, art, audio, names, lore, code snippets, fonts, or datasets are added to the product surface.

| Source ID | Source Name | Owner | License / Rights Basis | Allowed Use | Attribution Plan | Excluded Terms | Review Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-001 | AIDM original fantasy text | AIDM project | Original project-authored content | Local prototype and QA | No external attribution required | Official DND/SRD protected identity terms | local-only draft |
| SRC-TBD | External source name | TBD | TBD | TBD | TBD | TBD | blocked until reviewed |

Required review notes for every non-original source:

- capture the exact source URL, file path, or vendor record;
- record the license text or contract basis;
- define allowed product surfaces and prohibited surfaces;
- list required attribution text and placement;
- list protected identity terms or distinctive lore that must not be used;
- link legal reviewer, decision date, and expiration or renewal condition.

## Privacy Checklist Template

Use this checklist before public collection or retention of user data.

| Data Category | Purpose | Local Storage Surface | Retention Default | Export / Deletion Path | Consent Or Notice Requirement | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| Local account email and display name | Local prototype sign-in | JSON room store | Local developer data only | Delete local data file or future account deletion flow | Public notice required before hosted use | TBD |
| Room, player, character, memo, transcript, and inventory state | TRPG table continuity | JSON room store and browser localStorage tokens | Local developer data only | Delete room data file or future room export/delete workflow | Public notice required before hosted use | TBD |
| Browser voice and ambience preferences | Local playback preference | browser localStorage | Browser-controlled | Clear browser site data | Product copy only for local prototype | TBD |
| Future analytics, cookies, or telemetry | Not currently approved | none | none | none | Requires privacy review before implementation | TBD |

Required privacy review notes:

- identify whether data is personal, sensitive, child-directed, or support-only;
- define retention and deletion owner;
- define user export path and support escalation path;
- decide cookie and consent position before any hosted public release;
- include user-facing limitation copy for local prototype data durability and AI-generated narration.

## Gate Mapping

| Gate | Local Evidence | Remaining Blocker |
| --- | --- | --- |
| GATE-005 | Server guard, redaction, session, and room-permission tests | Production identity provider, distributed rate limit, abuse operations, audit logs, incident response, accepted residual-risk list |
| GATE-006 | Source registry and privacy checklist templates | Completed source inventory, license/IP review, attribution plan, excluded protected terms approval, privacy policy, deletion/export workflow, retention schedule, consent/cookie decision, legal review |

## Verification Commands

- `node --test tests/securityPrivacy.test.js`
- `node --test tests/serverRoutes.test.js`
- `node --test tests/publicReadinessGates.test.js`

Expected result: tests pass while `GATE-005` and `GATE-006` remain blocked.
