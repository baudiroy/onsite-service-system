# Task2067 — Customer-Facing Projection DB Result Cardinality Guard / No DB No Route No Smoke

## Scope

- Hardened the projection service DB-result boundary.
- Accepted DB result shape is a direct plain object with a direct `rows` array.
- The `rows` array must contain exactly one candidate row.
- Direct array results, non-plain result containers, missing `rows`, non-array `rows`, zero rows, and two or more rows fail closed.
- The service no longer selects the first matching row from a multi-row result.

## Safe-Deny Behavior

- Zero-row, multi-row, malformed result, and malformed single-row cases return the existing sanitized unavailable envelope:
  - `status: deny`
  - `messageKey: customerAccess.unavailable`
  - `customerVisible: false`
  - `data: null`
  - `error.messageKey: customerAccess.unavailable`
- The response does not reveal report existence, duplicate/multiple-row details, row count, raw IDs, raw DB results, raw rows, query metadata, driver metadata, SQL text, parameters, tokens, headers, provider payloads, or internal/private fields.

## Regression Coverage

- Valid `{ rows: [validPlainRow] }` behavior remains allowed.
- Task2058 `serviceSummary` still comes only from `approved_service_summary`.
- Task2061 `completionTime` still comes only from `completion_time`.
- Task2060 `publicAttachments` public item keys remain allowlisted.
- Task2059 `serviceReport` top-level keys remain allowlisted.
- Task2062 malformed projection rows still fail closed.
- Task2065 malformed or unauthorized `customerAccessContext` still fails closed before query.
- Task2066 input identifier consistency guard remains unchanged.

## Boundaries

- No DB changes.
- No actual DB execution.
- No migrations, SQL, seeds, schema, indexes, psql, db, migration dry-run, or migration apply.
- No repository query changes or query text changes.
- No route/controller/global mount changes.
- No HTTP handler or app adapter changes.
- No Zeabur/env/runtime smoke.
- No provider sending.
- No admin frontend.
- No AI/RAG/provider/model calls.
- No billing/settlement/payment/invoice work.
- No package or package-lock changes.
- The 7 held historical untracked docs were not touched.
