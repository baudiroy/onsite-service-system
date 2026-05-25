# Task 487 - Engineer Mobile Workbench Synthetic Fixture / Minimal Skeleton Tests

## Status

Task 487 adds a synthetic-only fixture and minimal skeleton tests.

It does not modify runtime code.

## Exact Allowed Files

Task 487 added only:

- `fixtures/engineerMobileWorkbench/syntheticEngineerMobileWorkbench.fixture.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js`
- `docs/task-487-engineer-mobile-workbench-synthetic-fixture-minimal-skeleton-tests-no-db-no-runtime-expansion.md`

## Scope Confirmation

Task 487 does not:

- modify backend `src/`
- modify `admin/src/`
- modify route/controller/resolver/guard/projection/auth/boundary/service/repository runtime code
- add actual auth/session validation
- add real permission decision
- add real projection data
- add DB / repository / service access
- add migration / Migration020
- execute DB / migration / psql
- execute smoke/browser/API tests
- implement mobile UI / PWA
- implement upload / signature / object storage
- trigger provider sending
- call AI/RAG/vector database
- modify `package.json`
- modify inventory docs

## Synthetic Fixture

The fixture is synthetic-only.

It exports:

- `syntheticEngineerContext`
- `syntheticTaskReference`
- `syntheticForbiddenPayloadMarkers`

The fixture uses clearly fake `synthetic-*` references and does not include real customer name, phone, address, raw LINE id, raw channel id, token, secret, api key, provider payload, photo, signature, attachment, production/shared/Zeabur data, or full customer PII.

The fixture is only for future tests and must not be imported by runtime code.

## Minimal Skeleton Tests

The test file is CommonJS-compatible and uses Node built-in test utilities.

It verifies skeleton-only behavior:

- controller, resolver, permission guard, projection, auth/session boundary, and completion submission boundary modules exist
- resolver methods return `statusCode: 501`
- resolver methods return `ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED`
- controller methods respond with 501 not implemented response
- guard skeleton does not return `allowed: true` or `allowed: false`
- projection skeleton returns `implemented = false`, `allowListOnly = true`, and `data = null`
- auth/session boundary returns `authenticated = null` and `engineerContext = null`
- completion submission boundary returns `stateMutated = false` and `draftCreated = null`
- skeleton response does not include customer / case / appointment / Field Service Report payload
- skeleton response does not include `finalAppointmentId`
- skeleton response does not include raw channel or provider payload markers

The tests do not:

- start Express
- make HTTP/API requests
- run smoke/browser tests
- connect to DB
- mock DB
- import repository / service modules
- trigger provider sending
- call AI/RAG
- test mobile UI
- create or modify Case / Appointment / Field Service Report records

## Test Framework Boundary

This repo currently does not define an `npm test` script.

Task 487 does not modify `package.json`.

The test file is kept compatible with Node built-in test utilities for future PM-scoped execution.

## Verification Performed

Task 487 verification should remain limited to PM-approved commands:

- `git diff --check`
- `node --check fixtures/engineerMobileWorkbench/syntheticEngineerMobileWorkbench.fixture.js`
- `node --check tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js`
- sensitive scan on the allowed fixture/test/doc paths
- static import scan on the fixture/test paths
- `npm run check`

Task 487 does not require `npm run admin:check` because `admin/src/` is untouched.

Task 487 does not require `npm test` because the repo has no test script and PM marked it optional.

## Future Scope Still Required

Future work still requires PM exact scope for:

- actual auth/session validation
- real permission decision
- real projection data
- DB / repository / service access
- runtime code changes
- completion persistence
- Field Service Report draft / formal Field Service Report creation
- Case / Appointment / Field Service Report mutation
- mobile UI / PWA
- upload / signature / object storage
- provider sending
- AI/RAG/vector database
- smoke/browser/API tests

## Migration / Schema Decision

No migration, schema, index, DB, or Migration020 change is included in Task 487.

## Runtime Decision

No runtime behavior is changed in Task 487.

The Engineer Mobile Workbench remains skeleton-only.
