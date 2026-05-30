# Task2215 Repair Intake Draft-to-Case Admin Route Safe Error Static Boundary Guard

## Scope

- Added a no-runtime-change static guard for the Task2214 admin route safe-error behavior.
- No runtime/source behavior changed.
- No route was exposed, mounted, expanded, or changed.
- No DB, repository, migration, env, Zeabur, smoke, endpoint, server/listener, provider, AI/RAG, admin frontend, billing, Customer Access, Engineer Mobile, or package work was performed.

## Static Safe-Error Markers Covered

- `createExpressSubmitHandler()` keeps a catch path for unexpected submit handler errors.
- Unexpected submit handler errors map to a fixed `503` safe envelope.
- The safe envelope remains limited to `ok`, `status`, `messageKey`, `reasonCode`, `caseId`, and `repairIntakeDraftId`.
- The safe envelope keeps `status: unavailable`, `messageKey: repair_intake_draft_to_case.admin_route_unavailable`, and `reasonCode: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR`.
- The catch path does not use raw exception messages, stack traces, raw request body fields, DB URLs, secrets, provider payloads, AI/RAG, billing, audit internals, token/password, customer/private fields, SQL/debug/internal/raw error data, or `next(error)`.
- Task2214 unit coverage remains present for disabled registration, missing ports, route composition exceptions, permission middleware failure, malformed request-like input, and successful admin route composition.
- The route remains admin-scoped and permission-gated with no public/open expansion markers.

## Static Guard

Added:

- `tests/repairIntake/repairIntakeDraftToCaseAdminRouteSafeError.static.test.js`

## Runtime Authorization Boundary

Task2215 does not authorize Task2216 or any public/open route exposure. PM must authorize one exact task at a time.
