# Task2038B Customer-facing Allow-path Contract Regression / No DB No Smoke

## Baseline

- Baseline commit: `05bb092c1d78aebd5da1b2c067e1d5392fa13b0a`
- Task2038 status: accepted as safe failed smoke.
- Task2038A classification: runtime bug likely.
- This Task2038B scope: no-DB synthetic regression tests plus the narrow customerAccess source fix required by those regressions.

## Task2038A Issues Covered

Task2038A identified two allow-path contract mismatches:

1. The customer access DB query executor treated `dbClient.query(...)` as if it returned rows synchronously. Normal PostgreSQL clients return a Promise, so the repository path could build an empty context and fail closed before the report projection handler.
2. The customer service report projection SQL selected only display fields, while the post-query filter required `organization_id`, `customer_id`, `case_id`, `public_report_id`, and publication/customer-visible fields.

Task2038B adds no-DB regression coverage for both issues and fixes the narrow customerAccess runtime path needed to satisfy that contract.

## Source Changes

- `src/customerAccess/customerAccessDbQueryExecutor.js`
  - Handles Promise-returning `dbClient.query(...)` results.
  - Preserves synchronous behavior for existing synthetic clients.
  - Continues to fail closed with sanitized `{}` on malformed or throwing clients.
- `src/customerAccess/customerAccessReadOnlyRepository.js`
  - Allows repository methods to return either synchronous contract objects or Promises from injected query executors.
  - Preserves read-model behavior and sanitized customer-visible projection output.
- `src/customerAccess/customerAccessContextProvider.js`
  - Resolves Promise-returning repository contract methods before building the customer access context.
  - Continues to fail closed on malformed or rejected repository results.
- `src/customerAccess/customerAccessContextMiddleware.js`
  - Supports async customer access context construction before calling `next`.
  - Preserves existing synchronous middleware behavior.
- `src/customerAccess/customerServiceReportProjectionService.js`
  - Selects the internal scope and publication columns required by its post-query filter.
  - Keeps the public response DTO allow-listed to customer-visible fields only.

## Regression Coverage

- Promise-returning dbClient coverage:
  - `tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js`
  - Added synthetic async pool coverage proving the full mounted customer access route returns HTTP `200` allow when all rows allow.
- Projection selected-field coverage:
  - `tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`
  - Added a query contract test requiring `organization_id`, `customer_id`, `case_id`, `public_report_id`, `publication_allowed`, `customer_visible_policy_passed`, and `publication_state`.
- Missing selected-field denial coverage:
  - `tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`
  - Added a display-only row regression proving missing scope/publication fields fail closed with the generic safe-deny envelope.
- Static read-only closure update:
  - `tests/customerAccess/customerServiceReportProjectionServiceClosure.static.test.js`
  - Updated the read-only query assertion to lock the new selected-field contract.

## Result

- Suspected bug confirmed: yes.
- Narrow source fix required: yes, scoped to `src/customerAccess`.
- Runtime source changed: yes, only customerAccess modules listed above.
- Public API response shape changed: no.
- Customer-visible DTO exposure widened: no.
- Raw DB rows exposed: no.
- Secrets, SQL text, stack traces, raw phone/address, provider payloads, billing internals, `finalAppointmentId`, and internal report fields remain excluded from tested responses.

## Checks

- Focused customerAccess tests:
  - `node --test tests/customerAccess/customerAccessDbQueryExecutor.unit.test.js tests/customerAccess/customerAccessReadOnlyRepository.unit.test.js tests/customerAccess/customerAccessReadOnlyRepositoryQueryExecutor.unit.test.js tests/customerAccess/customerAccessContextProvider.unit.test.js tests/customerAccess/customerAccessContextMiddleware.unit.test.js tests/customerAccess/customerAccessContextProviderRepositoryInjection.unit.test.js tests/customerAccess/customerAccessContextMiddlewareRepositoryInjection.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerServiceReportProjectionServiceClosure.static.test.js tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
  - Result: pass, `134` tests passed.
- Exploratory full customerAccess directory run:
  - `node --test tests/customerAccess/*.test.js`
  - Result: failed on historical/static closure tests that still assert pre-runtime no-production-route and current dirty-status branch-closure assumptions. The Task2038B focused regression set above passes.

## Explicit Non-actions

- No DB connection was opened.
- No SQL was run.
- No migration command was run.
- No seed command was run.
- No smoke was run.
- No endpoint was probed.
- `/healthz` was not called.
- No Zeabur UI, env value, deploy, redeploy, restart, or rollback was touched.
- No provider, billing, or AI execution was performed.
- No package, lockfile, or admin frontend files were modified.
- No secrets were inspected or printed.
- No Completion Report / FSR behavior was created, approved, published, revoked, or mutated.
- No `finalAppointmentId` mutation was performed.
- No customer-visible publication behavior was created or mutated.
- The 7 held historical docs were not touched.

## Recommendation

Recommend PM accept Task2038B as a no-DB regression/fix task. A future Task2038C may rerun the disposable local/test DB smoke only with a new exact approval target. Do not proceed to Task2039 until PM explicitly assigns the next batch.
