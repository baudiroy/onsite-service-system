# Task 613 - Customer Access Module Import Boundary Static Test / Exact Files Only / No Runtime Change

## Scope

Task613 adds a static import boundary test for the Customer Access module.

Allowed files:

- `tests/customerAccess/customerAccessModuleImportBoundary.static.test.js`
- `docs/task-613-customer-access-module-import-boundary-static-test-exact-files-only-no-runtime-change.md`

Task613 does not modify `src/` or any runtime file.

## Test Purpose

The static test protects the Customer Access module before app mount by confirming it has no accidental dependency on:

- DB.
- repositories.
- providers.
- AI / RAG.
- app bootstrap.
- server bootstrap.
- route index.
- migration runtime.
- write-side filesystem calls.

## Files Scanned

The test scans:

- `src/customerAccess/customerAccessResolver.js`
- `src/customerAccess/customerAccessResponseEnvelope.js`
- `src/customerAccess/customerAccessService.js`
- `src/customerAccess/customerAccessRequestMapper.js`
- `src/customerAccess/customerAccessFacade.js`
- `src/customerAccess/customerAccessHttpContextAdapter.js`
- `src/customerAccess/customerAccessHttpFacade.js`
- `src/customerAccess/customerAccessRouteRegistry.js`
- `src/controllers/customerAccessController.js`
- `src/routes/customerAccessRoutes.js`

## Allowed Dependency Direction

Task613 records and enforces this dependency direction:

```text
registry -> route -> controller -> HTTP facade -> adapter/facade -> mapper/service -> resolver/envelope
```

Allowed imports:

- route registry may import route module.
- route module may import controller.
- controller may import HTTP facade.
- HTTP facade may import adapter and facade.
- facade may import mapper and service.
- service may import resolver and envelope.
- pure resolver / envelope / request mapper / HTTP context adapter must not import runtime dependencies.

## Forbidden Dependency Classes

The static test checks import / require specifiers for forbidden dependency classes including:

- repositories.
- services outside the allowed Customer Access service helper.
- DB / database packages.
- migrations.
- providers.
- LINE / SMS / Email / push.
- AI / RAG / vector / OpenAI.
- audit runtime.

It also checks source text for high-risk runtime patterns:

- `transaction`.
- `fs.write`.
- `writeFile`.
- `createWriteStream`.
- `app.listen`.
- `express()`.
- `router.use`.

The test intentionally inspects import / require lines for dependency classes to reduce false positives from comments or documentation wording.

## Runtime Boundary

Task613 does not:

- add runtime code.
- modify `src/`.
- mount app routes.
- modify route index.
- connect to DB.
- run migrations.
- import providers.
- import AI / RAG.
- execute route handlers.
- add smoke tests.
- use real customer PII.
- use token / secret / LINE credential.

## Test Coverage

The static test covers:

- all specified files exist.
- all specified files use only allowed dependency direction.
- all specified files have no forbidden dependency imports.
- controller does not import DB / repository / provider / AI dependencies.
- route module and route registry do not import app / server bootstrap.
- no `app.listen`, `express()`, `router.use`, or write-side filesystem calls are present in the scanned source files.

## Verification

Allowed commands for Task613:

```bash
node --test tests/customerAccess/customerAccessModuleImportBoundary.static.test.js
git diff --check -- tests/customerAccess/customerAccessModuleImportBoundary.static.test.js docs/task-613-customer-access-module-import-boundary-static-test-exact-files-only-no-runtime-change.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task613.

## Mandatory Invariants

Task613 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Customer Access module cannot create, approve, complete, reopen, or publish a Field Service Report through hidden dependencies.
- Customer Access module cannot modify completion source-data through hidden dependencies.
- Customer Access module cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Guardrails Review

Task613 remains aligned with `PROJECT_GUARDRAILS.md`:

- no runtime behavior change.
- no schema or migration change.
- no app route registration.
- no DB / repository integration.
- no permission runtime integration.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
