# Task962 Repair Intake Draft-to-Case Route Registrar Static Boundary Test

## Scope

Task962 adds test-only hardening for the Task961 injected-router registrar:

- `tests/repairIntake/repairIntakeDraftToCaseRouteRegistrarBoundary.static.test.js`

No production source file is modified by this task.

## Boundary Coverage

The static test reads `src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js` and asserts that the registrar remains injected-router-only. It fails if the registrar imports, requires, constructs, or references forbidden runtime dependencies such as app/server bootstrap, global route indexes, public API route files, DTO/OpenAPI, DB clients, repositories, runtime factories, application service factories, controller factories, providers, LINE/SMS/App/email/webhook sending, AI/RAG/vector/provider runtime, admin frontend, billing/settlement/payment/invoice, smoke/shared runtime, or default global router/application-service construction.

The test also checks that forbidden sensitive field strings are absent from the registrar source:

- `finalAppointmentId`
- `fullAddress`
- `rawAddress`
- `phoneNumber`
- `lineAccessToken`
- `tokenSecret`
- `rawCustomerPayload`
- `rawImportedRow`

Injected seam names such as `router`, `routes`, `basePath`, and `handler` remain allowed.

## Out of Scope

- Production source changes
- Route registrar behavior changes
- App/server bootstrap
- Global route registration/index files
- Existing public API route files
- Public API DTO/OpenAPI
- DB execution / psql / SQL dry-run / `npm run db:migrate`
- Migration creation/apply
- Smoke/shared runtime
- Provider sending / LINE / SMS / App / email / webhook
- AI/RAG/vector/provider runtime
- Admin frontend
- Billing/settlement/payment/invoice
- Default global runtime registration
- Default controller/application service/router
- Sensitive data/token/secret/full phone/address/raw payload
- `finalAppointmentId`
- Task902
- Engineer Mobile Task921-Task933

Accepted Task921-Task961 files remain local / uncommitted / untracked and must not be cleaned, reverted, relocated, or restaged by this task.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseRouteRegistrarBoundary.static.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- tests/repairIntake/repairIntakeDraftToCaseRouteRegistrarBoundary.static.test.js docs/task-962-repair-intake-draft-to-case-route-registrar-static-boundary-test-no-app-bootstrap-no-openapi.md
git diff --check -- tests/repairIntake/repairIntakeDraftToCaseRouteRegistrarBoundary.static.test.js docs/task-962-repair-intake-draft-to-case-route-registrar-static-boundary-test-no-app-bootstrap-no-openapi.md
git status --short
```
