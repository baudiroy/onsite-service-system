# Task2068 - Customer-Facing Projection DB Query Exception Safe-Deny Guard

Status: implemented

Scope:
- Hardened the customer-facing service report projection DB-query boundary.
- No DB, migration, route, HTTP handler, smoke, Zeabur, provider, admin, AI, billing, package, or repository query text/parameter changes.
- The seven held historical docs remained untracked and untouched.

Changed files:
- `src/customerAccess/customerServiceReportProjectionService.js`
- `tests/customerAccess/customerServiceReportProjectionService.unit.test.js`
- `tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `docs/task-2068-customer-facing-projection-db-query-exception-safe-deny-guard-no-db-no-route-no-smoke.md`

Runtime behavior:
- Valid `{ rows: [validPlainRow] }` query behavior is preserved.
- `dbClient.query` is read only after service input and customer access context preconditions pass.
- Missing, malformed, non-plain, class-instance, Date, Error, Buffer-like, Promise-like, missing-query, non-function-query, and throwing-query-getter dbClient inputs fail closed.
- Synchronous query throws and rejected query promises fail closed.
- Raw DB driver errors, stacks, causes, SQL text, query parameters, row/result metadata, driver fields, tokens, headers, provider/debug/internal/private data, and raw rejection values are never serialized into the response.

Safe deny envelope:

```json
{
  "status": "deny",
  "messageKey": "customerAccess.unavailable",
  "customerVisible": false,
  "data": null,
  "error": {
    "messageKey": "customerAccess.unavailable"
  }
}
```

Regression coverage:
- Task2058 `serviceSummary` remains sourced only from `approved_service_summary`.
- Task2061 `completionTime` remains sourced only from `completion_time`.
- Task2060 public attachment response keys remain `attachmentId`, `label`, and `mimeType`.
- Task2059 service report top-level allowlist remains unchanged.
- Task2062 malformed projection row fail-closed behavior remains unchanged.
- Task2065 customer access context primitive guard remains unchanged.
- Task2066 input identifier consistency guard remains unchanged.
- Task2067 DB result shape and exact one-row cardinality guard remain unchanged.

Verification:
- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `git diff --check`
- `git status --short --branch`
