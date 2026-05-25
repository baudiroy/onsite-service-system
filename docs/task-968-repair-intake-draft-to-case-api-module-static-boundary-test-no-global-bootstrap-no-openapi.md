# Task968 — Repair Intake Draft-to-Case API Module Static Boundary Test / No Global Bootstrap No OpenAPI

## PM Scope

Task968 adds test-only hardening for the Task967 API module factory.

Allowed files:

- `tests/repairIntake/repairIntakeDraftToCaseApiModuleBoundary.static.test.js`
- `docs/task-968-repair-intake-draft-to-case-api-module-static-boundary-test-no-global-bootstrap-no-openapi.md`

Production source, existing Task934-Task967 files, Engineer Mobile Task921-Task933 files, Task902 files, admin frontend, global app/server bootstrap, DTO/OpenAPI, DB, migrations, providers, AI, billing, smoke/shared runtime, package files, and git staging are out of scope.

## Implemented Guard

The static test reads `src/repairIntake/repairIntakeDraftToCaseApiModule.js` and asserts:

- the only imported helpers are:
  - `./repairIntakeDraftCaseControllerAdapter`
  - `./repairIntakeDraftCaseRouteFactory`
  - `./repairIntakeDraftToCaseRouteRegistrar`
- forbidden import/require path patterns remain absent;
- forbidden default/global dependency construction patterns remain absent;
- forbidden sensitive field strings remain absent;
- accepted injected seam names remain allowed:
  - `applicationService`
  - `controller`
  - `routes`
  - `router`
  - `basePath`

## Sensitive Data Exclusion

The static guard fails if the API module source contains:

- `finalAppointmentId`
- `fullAddress`
- `rawAddress`
- `phoneNumber`
- `lineAccessToken`
- `tokenSecret`
- `rawCustomerPayload`
- `rawImportedRow`

## Boundary Confirmation

Task968 did not modify production source. It did not add global route registration, app/server bootstrap, DTO/OpenAPI, DB/repository creation, provider runtime, AI/RAG, admin frontend, billing, smoke/shared runtime, migrations, package runtime, or git staging.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleBoundary.static.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- tests/repairIntake/repairIntakeDraftToCaseApiModuleBoundary.static.test.js docs/task-968-repair-intake-draft-to-case-api-module-static-boundary-test-no-global-bootstrap-no-openapi.md
git diff --check -- tests/repairIntake/repairIntakeDraftToCaseApiModuleBoundary.static.test.js docs/task-968-repair-intake-draft-to-case-api-module-static-boundary-test-no-global-bootstrap-no-openapi.md
git status --short
git status --short -- tests/repairIntake/repairIntakeDraftToCaseApiModuleBoundary.static.test.js docs/task-968-repair-intake-draft-to-case-api-module-static-boundary-test-no-global-bootstrap-no-openapi.md
```
