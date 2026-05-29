# Task1891 Repair Intake Draft-to-Case Route / Safe Runtime Boundary

Status: implemented and verified with synthetic tests only.

Scope:
- Add a safe internal route boundary for Repair Intake draft-to-Case planning.
- Use the existing Task1889 planning service boundary.
- Expose a route definition and handler for planning/preflight only.
- Do not mount the route.

## Implementation Summary

- Added `src/repairIntake/repairIntakeDraftToCaseSafeRouteBoundary.js`.
- The boundary exposes one route definition:
  - `POST /repair-intake/drafts/:draftId/case/plan`
- The handler calls only an injected planning service with sanitized:
  - `draftId`
  - `organizationId`
  - `actorId`
  - `requestId`
- Request body organization/actor overrides are ignored.
- The public response envelope always keeps `caseId: null`.

## Safe Runtime Behavior

- Valid planning intent returns `200 planned`.
- Missing draft id returns `400 invalid_request`.
- Missing authenticated organization/actor context returns `403 denied`.
- Organization mismatch maps to `403 denied`.
- Duplicate review-required results map to `202 review_required`.
- Missing planning dependency maps to `503 unavailable`.
- Planning service failures map to `503 unavailable` without raw error leakage.

Route output is intentionally small and does not expose case candidates, raw draft rows, SQL, stack traces, secrets, provider payloads, raw phone/address, billing internals, AI output, or internal decision internals.

## Explicit Non-goals

- No submit route.
- No route mount.
- No app/server bootstrap change.
- No DB connection.
- No SQL execution.
- No migration.
- No seed.
- No smoke.
- No deploy.
- No Zeabur env changes.
- No provider sending.
- No AI/RAG.
- No billing.
- No formal Case creation.
- No draft-to-formal-Case linking.
- No Case persistence.
- No Completion Report / Field Service Report creation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.

## Verification Summary

- Added synthetic route boundary tests for:
  - safe allow path with injected planning service;
  - missing draft id safe failure;
  - missing auth/context safe failure;
  - organization mismatch safe deny;
  - duplicate review-required response;
  - missing dependency safe failure;
  - service failure sanitization.
- Added static Task1891 boundary coverage for:
  - no DB/migration/seed/smoke/deploy behavior;
  - no submit route;
  - no formal Case creation/linking/persistence;
  - no provider/AI/billing execution;
  - no Completion Report / Field Service Report creation;
  - no finalAppointmentId mutation.
