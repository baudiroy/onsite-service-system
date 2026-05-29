# Task2123 - Customer Access Audit Persistence Planning

## Status

- Documentation-only planning for future Customer Access audit persistence.
- No runtime persistence is authorized or implemented.
- No DB table, migration, repository, query, DB writer, source, test, package, route, controller, mount, smoke, server, listener, network, Zeabur/env, provider, admin, AI, billing, settlement, payment, invoice, package, or package-lock work was performed.
- The 7 held historical docs remain untracked and untouched.

## Current Accepted Audit State

Audit event builder:

- Pure, deterministic, and non-mutating.
- Does not perform runtime integration by itself.
- Supports accepted Customer Access event types:
  - `customer_access.case_overview.allow`
  - `customer_access.case_overview.deny`
  - `customer_access.service_report.allow`
  - `customer_access.service_report.deny`
  - `customer_access.route_registration.success`
  - `customer_access.route_registration.failure`
- Emits only accepted audit event keys.
- Strips sensitive, raw, unsafe, and matrix-invalid data.

Audit writer result normalizer:

- Normalizes writer results to `recorded`, `skipped`, or `failed`.
- Provides no persistence.
- Returns safe result shapes only.
- Does not expose raw writer result fields.

Audit writer adapter:

- Accepts only injected `function writer(auditEvent)`.
- Has no global fallback.
- Contains writer throw, rejection, and malformed result.
- Normalizes results through the accepted writer result normalizer.

Runtime side-channel integrations:

- Case overview.
- Service-report.
- Route registration.
- All use optional injected `auditWriter` only.
- Audit failure does not affect customer response or registration summary.
- Audit result is not customer-visible and is not added to registration summary.

Current non-authorized areas:

- Context middleware audit integration.
- DB/repository/query audit integration.
- Audit persistence or DB writer.
- Production mount.

## Future Audit Persistence Design Goals

Future audit persistence must:

- Be append-only.
- Be organization-isolated.
- Store only sanitized audit event fields already produced by the builder.
- Avoid raw request, response, body, header, cookie, session, token, and auth data.
- Avoid raw customer phone, address, email, and LINE identity.
- Avoid raw `customerAccessContext`.
- Avoid DB rows, query metadata, query text, query values, and SQL.
- Avoid provider payload, AI payload, debug, private, and admin-only data.
- Remain side-channel only: persistence failure must not affect customer response or registration summary.

## Conceptual Table Shape - Not Approved DDL

Suggested table name:

- `customer_access_audit_events`

Suggested conceptual columns:

- `id`
- `event_type`
- `occurred_at`
- `request_id`
- `actor_type`
- `organization_id`
- `customer_id`
- `case_id`
- `report_id`
- `decision`
- `reason_code`
- `route`
- `method`
- `source`
- `metadata_json`
- `created_at`

This is conceptual only. No migration, DDL, SQL execution, or schema change is authorized by this task.

## Future Repository And Writer Boundaries

Future persistence writer boundaries:

- Persistence writer must be injected.
- DB writer must call only a repository or DB client passed explicitly.
- No global DB pool fallback.
- No env or Zeabur fallback.
- Writer must accept only sanitized `auditEvent` from the builder.
- Writer must normalize result through the Task2106-Task2107 normalizer contract.
- Writer must not throw raw DB errors through runtime.
- Writer must not leak SQL, params, connection strings, driver errors, stack traces, or raw DB metadata.
- Writer must return only `recorded`, `skipped`, or `failed` result shapes.

Future repository boundaries:

- Repository must receive explicit sanitized fields only.
- Repository must not receive raw request/response/context objects.
- Repository must not decide customer-facing behavior.
- Repository failure must be converted to safe writer failure.
- Repository implementation must be separately authorized.

## Future Migration And Readiness Steps

Future Task A candidate:

- Repository contract skeleton.
- No DB execution.
- No migration creation.

Future Task B candidate:

- Migration design packet.
- No migration apply.
- No SQL execution.

Future Task C candidate:

- Disposable/local DB dry-run authorization packet, if needed.
- Requires explicit PM/user authorization before any DB command.

Future Task D candidate:

- Injected persistence writer adapter.
- No runtime integration.
- No DB persistence until repository/migration are authorized.

Future Task E candidate:

- Runtime integration switch from synthetic writer to injected persistence writer.
- Still optional and injected.
- Must preserve side-channel failure isolation.

All future steps require separate authorization.

## Indexing And Isolation Considerations

Organization isolation:

- `organization_id` should be present when the event has organization context.
- No cross-organization query assumptions.
- No customer-visible audit endpoint is authorized.

Likely future query patterns:

- By `organization_id`.
- By `case_id`.
- By `report_id`.
- By `event_type`.
- By `occurred_at` or `created_at`.

No admin audit UI is authorized by this planning task.

## Explicit Non-Goals

- No source/runtime/test changes except this document.
- No DB table creation.
- No migration file.
- No SQL execution.
- No repository implementation.
- No audit writer persistence implementation.
- No runtime persistence integration.
- No production mount.
- No smoke, endpoint probe, server, listener, network, Zeabur, or env work.
- No provider, admin, AI, billing, package, or package-lock work.

## Verification

Executed commands for this docs-only planning task:

```sh
git diff --check -- docs/task-2123-customer-access-audit-persistence-planning-no-runtime-change-no-db-no-migration.md
git status --short --branch
```

Results:

- `git diff --check -- docs/task-2123-customer-access-audit-persistence-planning-no-runtime-change-no-db-no-migration.md`: PASS.
- `git status --short --branch`: branch `main...origin/main` with only the Task2123 doc plus the 7 held historical docs untracked before commit.

Node tests were not required or run because this task is documentation-only and no source or test files were changed.
