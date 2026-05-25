# Task990 Repair Intake Draft-to-Case HTTP Mount Adapter Static Boundary Test

## Scope

Task990 adds test-only static boundary coverage for the Task989 HTTP mount adapter:

- `tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js`

No production source files are modified.

## Implemented Guard

The static test reads:

- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`

It asserts that the mount adapter:

- imports or requires no modules;
- imports no forbidden runtime dependency paths;
- constructs no default app, router, application service, controller, route factory, API module factory, DB client, repository, provider, AI runtime, admin surface, billing runtime, smoke/shared runtime, OpenAPI/DTO surface, migration, or package runtime;
- contains no forbidden sensitive field strings;
- keeps the accepted injected seam names available: `mountTarget`, `apiModule`, `routes`, `basePath`, `handler`, and `register`.

## Sensitive Data Exclusion

The static guard fails if the mount adapter source contains:

- `finalAppointmentId`
- `fullAddress`
- `rawAddress`
- `phoneNumber`
- `lineAccessToken`
- `tokenSecret`
- `rawCustomerPayload`
- `rawImportedRow`

## Boundary Confirmation

Task990 did not modify:

- production source files
- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`
- app/server bootstrap
- global route indexes
- existing public API route files
- DTO/OpenAPI docs
- DB migrations/schema/SQL/seed
- fixtures
- package files
- smoke/shared runtime scripts
- `admin/src/**`
- provider integrations
- LINE/SMS/App/email/webhook
- AI/RAG/vector/provider runtime
- billing/settlement/payment/invoice
- Task902

Git staging was intentionally not performed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js docs/task-990-repair-intake-draft-to-case-http-mount-adapter-static-boundary-test-no-global-bootstrap-no-openapi.md
git diff --check -- tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js docs/task-990-repair-intake-draft-to-case-http-mount-adapter-static-boundary-test-no-global-bootstrap-no-openapi.md
git status --short -- tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js docs/task-990-repair-intake-draft-to-case-http-mount-adapter-static-boundary-test-no-global-bootstrap-no-openapi.md
git diff --cached --name-only
```
