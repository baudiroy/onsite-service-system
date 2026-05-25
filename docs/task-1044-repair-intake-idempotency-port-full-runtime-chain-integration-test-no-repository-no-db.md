# Task1044 — Repair Intake IdempotencyPort Full Runtime Chain Integration Test

## Scope

- Add a full-runtime-chain integration test for submit flow with idempotency port behavior.
- No production source (`src/**`) changes.
- No DB / migration / schema change.
- No API shape change.
- No repository-backed writer persistence and no repository write/read implementation.
- No provider/LINE/SMS/App/email/webhook/billing/settlement paths.
- No `admin/src` scope.
- No cleanup / reset / revert / stash / commit operations.
- No `psql` or `db:migrate`.

## Exact Allowed Files

- `tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js`
- `docs/task-1044-repair-intake-idempotency-port-full-runtime-chain-integration-test-no-repository-no-db.md`

## Required Behavior

The new integration test must verify full request chain for `repairIntakeDraftToCase` submit route with injected in-memory adapters:

- No existing idempotency result path:
  - adapter call order:
    - `idempotencyStore.find`
    - `draftRepository`
    - `planningPolicy`
    - `caseCreationPort`
    - `auditPort`
    - `idempotencyStore.record`
  - payload sanitization for each chain call:
    - no unsafe field leakage (SQL, token, raw payload, phone/address/customerName/finalAppointmentId, stack/rawResult, repo/audit/provider internals, etc.)
    - idempotency lookup contains expected required values:
      - `idempotencyKey = idem_task1044`
      - `draftId = draft_task1044`
      - `organizationId = org_task1044`
      - `tenantId = tenant_task1044`
      - `requestId = req_task1044`
    - response is successful and includes case creation/audit result.
- Existing idempotency replay path:
  - only `idempotencyStore.find` is called.
  - no core ports or replay re-recording are executed.
  - replay output preserves `idempotentReplay = true`.
  - full unsafe-field redaction still holds.

## Required Verification Command

```bash
node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js
find src tests -name '*.js' -print0 | xargs -0 -n1 node --check
node --check tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js
```

## Completion Report

Task1044 completed locally.

Modified/added:
- `tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js` (new)
- `docs/task-1044-repair-intake-idempotency-port-full-runtime-chain-integration-test-no-repository-no-db.md` (updated)

Verification:
- `node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js` -> PASS
- `node --test tests/repairIntake/repairIntakeIdempotencyPortAdapterBoundary.static.test.js` -> PASS
- `node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js` -> PASS
- `node --test tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js` -> PASS (2/2)
- `node --check tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js` -> PASS
- `find src tests -name '*.js' -print0 | xargs -0 -n1 node --check` -> PASS

## Task1044A Acceptance Gap Closure

Task1044A completed locally.

Implemented / changed files:
- `docs/task-1044-repair-intake-idempotency-port-full-runtime-chain-integration-test-no-repository-no-db.md`

Source/test/runtime modified during Task1044A: no.

Task1044 acceptance gap closed:
- Task1044 integration test file exists: yes.
- Task1044 doc exists/updated: yes.
- Production source modified during Task1044A: no.
- Staging: no.

Verification:
- `node --test tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js` -> PASS (2/2)
- `node --test tests/repairIntake/repairIntakeIdempotencyPortAdapterBoundary.static.test.js` -> PASS (6/6)
- `node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js` -> PASS (6/6)
- `node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js` -> PASS (2/2)
- `node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js` -> PASS (1/1)
- `node --test tests/repairIntake/repairIntakeAuditWriterPortAdapterBoundary.static.test.js` -> PASS (7/7)
- `node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js` -> PASS (4/4)
- `node --check tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js` -> PASS
- `find src tests -name '*.js' -print0 | xargs -0 -n1 node --check` -> PASS
- `git diff --name-only` -> existing tracked patch stack only:
  - `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
  - `migrations/README.md`
  - `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
  - `scripts/smoke/029_single_open_appointment_guard_smoke.js`
  - `src/app.js`
  - `src/repositories/DispatchRepository.js`
  - `src/repositories/FieldServiceReportRepository.js`
  - `src/routes/index.js`
  - `src/routes/public.routes.js`
  - `src/server.js`
  - `src/services/AppointmentService.js`
  - `src/services/FieldServiceReportService.js`
- `git diff --cached --name-only` -> PASS / no output
- `git status --short -- docs/task-1044-repair-intake-idempotency-port-full-runtime-chain-integration-test-no-repository-no-db.md tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js` -> two untracked Task1044 files only.

Scope boundaries held:
- No `src/**` change during Task1044A.
- No `tests/**` change during Task1044A.
- No DB / migration / repository writer.
- No API shape change.
- No admin.
- No provider / LINE / SMS / App / email / webhook.
- No AI / RAG.
- No billing / settlement / payment / invoice.
- No staging / cleanup / revert / reset / stash / commit.
