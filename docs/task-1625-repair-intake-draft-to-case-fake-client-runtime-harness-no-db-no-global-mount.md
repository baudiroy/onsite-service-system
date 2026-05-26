# Task1625 Repair Intake Draft-to-Case Fake-Client Runtime Harness

Status: test-only runtime harness, no source edit, no DB, no global mount.

## PM Direction

Task1625 acceptance target:

- Add one new fake-client runtime harness unit test.
- Add one docs file.
- No source edits.
- No staging.
- No DB action.
- No global runtime action.

## Files Added

- `tests/repairIntake/repairIntakeDraftToCaseFakeClientRuntimeHarness.unit.test.js`
- `docs/task-1625-repair-intake-draft-to-case-fake-client-runtime-harness-no-db-no-global-mount.md`

## Runtime Boundary

This task does not add production runtime source.

The test-only harness uses the existing injected entry point:

- `createRepairIntakeDraftToCaseInjectedRouteComposition`

The harness mounts only onto an in-test synthetic target with base path:

- `/fake-client-runtime`

No app, server, route registrar, repository implementation, DB client, provider, smoke runtime, or global mount is touched.

## Fake-Client Harness Shape

The unit test keeps fake clients local to the test file:

- `idempotencyClient.findExistingDraftToCaseResult`
- `idempotencyClient.recordDraftToCaseResult`
- `draftClient.findDraftForConversion`
- `planningClient.planCaseFromDraft`
- `caseClient.createCaseFromDraft`
- `auditClient.recordDraftToCaseDecision`

The test adapts fake clients into the existing injected port shape:

- `idempotencyStore.findExistingDraftToCaseResult`
- `idempotencyStore.recordDraftToCaseResult`
- `draftRepository.findDraftForConversion`
- `planningPolicy.planCaseFromDraft`
- `caseCreationPort.createCaseFromDraft`
- `auditPort.recordDraftToCaseDecision`

## Assertions Added

The new unit test verifies:

- the route composition mounts exactly two routes on an explicit synthetic target;
- plan dispatch calls only draft fake client and planning fake client;
- submit dispatch calls fake clients in this order:
  - idempotency find;
  - draft read;
  - plan;
  - case create;
  - audit;
  - idempotency record;
- permission-denied submit stops before all fake clients;
- response and forwarded payloads remain sanitized;
- raw request data, headers, phone, address, LINE identifiers, tokens, secrets, SQL, DB URL, provider payload, stack traces, raw rows, and `finalAppointmentId` do not leak.

## Explicit Non-Goals

- No production source edit.
- No DB connection.
- No `psql`.
- No SQL dry-run/apply.
- No migration dry-run/apply.
- No `npm run db:migrate`.
- No real repository-backed writer.
- No default audit writer.
- No global route mount.
- No app/server/listen startup.
- No smoke/shared runtime.
- No provider sending.
- No LINE/SMS/email/webhook action.
- No AI/RAG/vector action.
- No billing/settlement action.
- No admin/frontend action.
- No customer-visible rollout.
- No cleanup/reset/stash/revert/clean.

## Guardrails Preserved

- One Case can have at most one formal Field Service Report.
- Do not create a second formal Field Service Report.
- Preserve `field_service_reports.case_id` uniqueness.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- Repair Intake draft-to-Case must not bypass Case creation rules.
- Organization isolation, permission checks, safe-deny behavior, and audit remain mandatory.
- AI remains advisory only.
- LINE/channel identity must not be hard-coded globally.
- SaaS/entitlement-safe boundaries remain mandatory.

## Verification

Recommended verification:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseFakeClientRuntimeHarness.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js
git diff --check -- tests/repairIntake/repairIntakeDraftToCaseFakeClientRuntimeHarness.unit.test.js docs/task-1625-repair-intake-draft-to-case-fake-client-runtime-harness-no-db-no-global-mount.md
git diff --cached --name-only
git diff --name-only -- src fixtures migrations admin package.json package-lock.json
```
