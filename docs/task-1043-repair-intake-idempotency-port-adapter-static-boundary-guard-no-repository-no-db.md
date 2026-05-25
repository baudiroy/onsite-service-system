# Task1043 — Repair Intake IdempotencyPort Adapter Static Boundary Guard / No Repository No DB

## Scope

- Add static boundary guard coverage for `repairIntakeIdempotencyPortAdapter`。
- No production source changes in this task.
- No repository-backed writer changes, no migration/DB/sql operations, no API shape change.
- No admin/route/provider/AI/billing/settlement runtime path changes.
- No `git add` / commit / stash / cleanup / revert / reset actions.

## Exact Allowed Files

- `tests/repairIntake/repairIntakeIdempotencyPortAdapterBoundary.static.test.js`
- `docs/task-1043-repair-intake-idempotency-port-adapter-static-boundary-guard-no-repository-no-db.md`

## Forbidden for This Task

- `src/**`（production source)
- `tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js`
- `migrations/**`
- `admin/**`
- `package.json` / `package-lock.json`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/**`
- `git add` / `git commit` / staged changes
- `no cleanup / revert / stash / reset`
- no DB / SQL / migration / `psql` / `db:migrate`
- no global app mount / no listen server startup

## Required behavior

- Add static test file with source-text assertions for `src/repairIntake/repairIntakeIdempotencyPortAdapter.js`:
  - `createRepairIntakeIdempotencyPortAdapter`
  - `RepairIntakeIdempotencyPortAdapterError`
  - required method seams: `idempotencyStore.findExistingDraftToCaseResult` / `idempotencyStore.recordDraftToCaseResult`
  - plain-object validation and sanitized input extraction (`createLookupInput`, `createRecordInput`, `firstSafeString`, `sanitizeValue`)
  - no-existing / replay-ready / recorded envelope behavior assertions
  - sync-thrown and async-rejected sanitization assertions for both methods
- assert expected reason codes exist in source:
  - `REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_STORE_REQUIRED`
  - `REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID`
  - `REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_FIND_FAILED`
  - `REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_RECORD_FAILED`
  - `REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_NO_EXISTING_RESULT`
  - `REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_REPLAY_READY`
  - `REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_RECORDED`
- add forbidden marker static checks for coupling signals:
  - runtime/repo/bootstrap/provider/billing/API coupling markers (e.g. `require('../db')`, `app.listen`, `fetch(`, `lineAccessToken`, `finalAppointmentId`, SQL verbs / ORM imports, messaging/provider senders)

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeIdempotencyPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js
node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapter.unit.test.js
git diff --cached --name-only
```

`git diff --cached --name-only` should remain empty.

## Completion Report Format

```text
Task1043 completed locally.
Production source modified: no.
New file:
- tests/repairIntake/repairIntakeIdempotencyPortAdapterBoundary.static.test.js

Verification:
- node --test tests/repairIntake/repairIntakeIdempotencyPortAdapterBoundary.static.test.js -> PASS
- node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js -> PASS
- node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js -> PASS
- node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js -> PASS
- node --test tests/repairIntake/repairIntakeAuditWriterPortAdapterBoundary.static.test.js -> PASS
- node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js -> PASS
- node --test tests/repairIntake/repairIntakeCasePlannerPortAdapterBoundary.static.test.js -> PASS
- node --test tests/repairIntake/repairIntakeCasePlannerPortAdapter.unit.test.js -> PASS
- node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapterBoundary.static.test.js -> PASS
- node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapter.unit.test.js -> PASS
- git diff --cached --name-only: empty
```

## Task status note

- Task1042A remains accepted.
- Task1043 is a static-only follow-up and introduces no runtime route / provider / DB / migration changes.
