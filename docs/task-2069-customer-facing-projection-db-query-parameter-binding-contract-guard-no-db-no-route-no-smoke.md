# Task2069 - Customer-Facing Projection DB Query Parameter Binding Contract Guard

Status: implemented

Scope:
- Added runtime/unit-test coverage for the customer-facing projection DB query invocation contract.
- No SQL/query text semantics, DB, migration, route, HTTP handler, smoke, Zeabur, provider, admin, AI, billing, or package changes.
- The seven held historical docs remained untracked and untouched.

Changed files:
- `tests/customerAccess/customerServiceReportProjectionService.unit.test.js`
- `tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `docs/task-2069-customer-facing-projection-db-query-parameter-binding-contract-guard-no-db-no-route-no-smoke.md`

Query call shape:
- `dbClient.query` is called exactly once for valid input.
- The call receives one frozen query config object:
  - `name: 'customerServiceReportProjection'`
  - `readOnly: true`
  - `text: <existing static select query text>`
  - `values: Object.freeze([organizationId, customerId, caseId, reportId])`

Query values order:
1. `customerAccessContext.organizationId`
2. `customerAccessContext.customerId`
3. top-level validated `caseId`, consistent with `customerAccessContext.caseId`
4. top-level validated `reportId`

Guarded behavior:
- Query values are validated primitive strings only.
- Raw `customerAccessContext`, raw service input, request-like containers, headers, authorization, cookies, body, query, params, user, session, provider payloads, raw payloads, debug payloads, arrays, objects, functions, classes, token/header-looking values, and SQL-looking user strings are not bound as query parameters.
- Invalid customer access context, invalid `caseId`, invalid `reportId`, and mismatched `caseId` fail before query.
- Task2067 DB result cardinality guard and Task2068 query throw/reject guard remain covered.

Verification:
- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `git diff --check`
- `git status --short --branch`
