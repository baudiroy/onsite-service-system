# Task2338 Repair Intake Migration 026 Disposable DB Dry-Run Authorization Packet

## Scope

Task2338 prepares a future authorization packet for a disposable local/test DB dry-run of `migrations/026_create_repair_intake_persistence_tables.sql`.

This task is documentation plus source/migration-reading static guard only. It does not change runtime, source, migration behavior, route behavior, repository behavior, package files, providers, admin frontend, Customer Access, Engineer Mobile, billing, AI/RAG, smoke coverage, staging, or production.

Task2338 does not authorize DB execution, SQL execution, migration dry-run, migration apply, migration creation or modification, `DATABASE_URL`, env, Zeabur, or secrets inspection, server/listener startup, smoke tests, endpoint probes, provider sending, package changes, route/admin production DB-backed wiring, or any future task.

## Migration 026 Inventory

`migrations/026_create_repair_intake_persistence_tables.sql` is still authoring-only. Its header states that dry-run or apply requires separate explicit disposable DB authorization and that no DB connection or execution is authorized by the file.

Migration 026 contains four Repair Intake persistence table proposals:

- `repair_intake_drafts`
- `repair_intake_draft_case_conversions`
- `repair_intake_idempotency_records`
- `repair_intake_audit_events`

### `repair_intake_drafts`

The draft table includes organization scope through `organization_id`, optional tenant scope through `tenant_id`, draft lifecycle status, source/source reference fields, import/reporting references, safe summary and metadata JSON objects, validation status, safe validation errors, and created/updated/validated/converted/rejected/expired timestamps.

Key constraints and indexes visible in the migration:

- status check for received, validated, needs review, ready for conversion, converted, rejected, and expired
- non-blank source check
- JSON object/array checks for safe fields
- organization/status/created index
- organization/source/source reference index
- organization/tenant/created index
- organization/import batch index

### `repair_intake_draft_case_conversions`

The conversion table includes organization scope, optional tenant scope, a draft foreign key, case id/ref fields, conversion status, idempotency key, actor/request attribution, safe metadata, planned/submitted/converted/failed timestamps, and created/updated timestamps.

Key constraints and indexes visible in the migration:

- status check for planned, submitted, converted, duplicate replayed, conflict, failed, and cancelled
- safe metadata JSON object check
- organization/draft/created index
- organization/case/created index
- organization/status/created index
- organization/idempotency key index

### `repair_intake_idempotency_records`

The idempotency table includes organization scope, optional tenant scope, idempotency key, operation type, optional draft reference, safe request fingerprint, replay case id/ref, safe replay result JSON, record status, first seen/completed/last replayed/expiry/retention timestamps, and created/updated timestamps.

Key constraints and indexes visible in the migration:

- non-blank idempotency key, operation type, and safe request fingerprint checks
- status check for in progress, completed, failed, and expired
- safe replay result JSON object check
- unique organization/tenant/operation/idempotency key index using a null-tenant sentinel
- organization/draft index
- organization/expiry index

### `repair_intake_audit_events`

The audit table includes organization scope, optional tenant scope, event type, draft reference, case id/ref, actor attribution, request id, decision/outcome, reason code, safe metadata JSON, internal-only visibility, occurred/created timestamps, and retention timestamp.

Key constraints and indexes visible in the migration:

- non-blank event type and outcome checks
- visibility restricted to `internal_only`
- safe metadata JSON object check
- organization/created index
- organization/event/created index
- organization/draft/created index
- organization/case/created index
- organization/request index

## Current Accepted Readiness

- DB-backed draft reader seam exists behind injected fake/query clients.
- DB-backed idempotency seam exists behind injected fake/query clients.
- DB-backed case creator transaction skeleton exists behind injected fake transaction clients.
- Runtime ports factory composes the accepted DB-backed seams through explicit injected dependencies.
- Audit persistence fake-client path is aligned to `repair_intake_audit_events`.
- The full fake/synthetic chain with audit has passed using fake draft/idempotency DB, fake transaction runner, fake case repository, and fake audit DB client only.

## Future Disposable DB Dry-Run Requirements

A future migration 026 dry-run task must be authorized separately by PM as one exact task. That future task must define the target, commands, stop conditions, rollback/drop policy, and expected verification output before anything runs.

Future dry-run requirements:

- target must be a disposable local/test DB only
- no production DB
- no staging DB
- no shared DB
- no Zeabur or shared runtime
- no provider sending
- no app/server/listener startup
- no endpoint probes or smoke tests
- no secrets printed
- no database URL printed
- any future command must be PM-authorized in a separate exact task
- future task must define stop conditions
- future task must define rollback/drop policy for the disposable DB
- future task must define expected verification output

## Explicit Non-Authorization

Task2338 does not authorize:

- DB connection
- SQL execution
- migration dry-run
- migration apply
- migration creation or modification
- env, Zeabur, or secrets inspection
- smoke or endpoint probes
- server/listener startup
- provider sending
- package changes
- route/admin production DB-backed wiring

## Recommended Next Task

Recommended next exact task, non-authorized by this packet:

Task2339 - Repair Intake Migration 026 Disposable Local/Test DB Dry-Run / Explicit DB Authorization Required

Task2339 must not start unless PM explicitly authorizes DB execution and the disposable DB target. This Task2338 packet is only preparation and does not itself authorize Task2339.

## Static Guard Coverage

`tests/repairIntake/repairIntakeMigration026DisposableDbDryRunAuthorization.static.test.js` reads migration, doc, and related guard text only. It verifies:

- migration 026 exists
- migration 026 contains the expected Repair Intake table markers
- this Task2338 doc says no DB execution
- this Task2338 doc says no migration apply
- this Task2338 doc says disposable local/test DB only for future dry-run
- this Task2338 doc forbids production, staging, and shared DB targets
- this Task2338 doc forbids env, Zeabur, and secrets inspection
- this Task2338 doc does not include executable real DB command blocks
- this Task2338 doc contains no real-looking database URL or credentials

## Runtime Statement

- No DB execution occurred.
- No SQL was executed against a real DB.
- No migration was created, dry-run, modified, or applied.
- Migration 026 was not applied.
- No `DATABASE_URL`, env, Zeabur, or secrets values were inspected.
- No server/listener was started.
- No smoke or endpoint probe was run.
- No provider sending occurred.
- No package or package-lock changes occurred.

Future implementation remains blocked until PM authorizes one exact bounded task.

## Held Docs

The same 7 held historical untracked docs remain outside Task2338 scope and must stay untouched unless PM explicitly authorizes that exact action.
