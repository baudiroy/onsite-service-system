# Task 673 — Data Correction Persistence Writer Contract E2E Compatibility Test / No Runtime Change / No DB

## Scope

Task673 adds E2E compatibility coverage for the Task672 persistence writer contract.

The test injects `createDataCorrectionPersistenceWriterSet(options)` into the existing Data Correction app/server options path and verifies that the current route stack can flow through:

`route/app/server -> permission middleware -> controller -> orchestrator -> downstream services -> persistence writer contract -> injected low-level test writers`

This task is test-only plus task documentation. It does not modify runtime source.

## Files Changed

- Added `tests/dataCorrection/dataCorrectionPersistenceWriterE2E.integration.test.js`
- Added `docs/task-673-data-correction-persistence-writer-contract-e2e-compatibility-test-no-runtime-change-no-db.md`

## Covered Behaviors

The E2E test verifies:

- `createApp({ dataCorrection: persistenceWriterSet })` pre-departure apply calls the injected low-level correction application writer with sanitized payload.
- Post-departure freeze calls injected low-level contact log, dispatch note, and audit writers with sanitized payload.
- Unable-to-complete result calls injected low-level appointment result, evidence, and audit writers.
- Unable-to-complete path keeps `fieldServiceReportCreated` false and does not expose or mutate `finalAppointmentId`.
- Follow-up proposal calls injected low-level follow-up draft, dispatch note, and audit writers.
- Follow-up proposal keeps `formalAppointmentCreated` false.
- Phone correction with valid permission returns re-verification and does not call the correction application writer.
- AI role is denied before low-level writers.
- Low-level writer throw returns a safe persistence failure envelope when called through the persistence writer contract.
- Route path remains redacted and does not leak raw error details when a low-level writer throws.
- `createServerBootstrap({ dataCorrection: persistenceWriterSet })` works without calling `listen`.
- `createServerBootstrap({ app, dataCorrection })` preserves `options.app` priority and bypasses the ignored `dataCorrection` writer set.
- Low-level writer payloads contain only allow-listed fields.
- Test and persistence writer source avoid DB, SQL, repository, provider, AI, smoke, and browser dependencies.

## Safety Boundary

The test uses only synthetic sentinel strings and injected low-level writer functions. It does not use real customer data, token values, LINE credentials, provider credentials, database URLs, or raw payloads.

Low-level writer payloads are asserted to exclude:

- raw phone, address, LINE user id, `line_user_id`
- token, secret, password, database URL values
- internal note, audit raw payload, AI raw payload
- `finalAppointmentId`
- raw request/body/header/cookie containers
- raw `fromValue` / `toValue`

## Runtime Decision

- No runtime source change.
- No API change.
- No route/app/server change.
- No DB connection.
- No SQL.
- No migration.
- No real persistence.
- No provider, notification, LINE, SMS, App push, Email, AI, RAG, vector, browser, or smoke runtime.
- No admin frontend change.

## Compatibility Note

Task673 confirms the persistence writer contract can replace the safe in-memory writer set for route/app/server compatibility tests.

When a low-level writer throws, the persistence writer contract returns a safe failure object without exposing raw error details. The current downstream service writer adapters treat the injected high-level writer as handled when it returns instead of throwing, so route-level behavior remains redacted and safe. A future persistence integration task should decide whether downstream services should consume returned writer failure objects as explicit failed writer results.

## Future Tasks

- Connect real low-level persistence writers only in a separately scoped DB/repository task.
- Decide whether downstream Data Correction services should inspect high-level writer return values from persistence contracts.
- Add repository-backed transaction behavior only after DB schema and migration scope are approved.
- Add smoke coverage only after real persistence exists.

## Verification

Executed verification commands:

- `node --test tests/dataCorrection/dataCorrectionPersistenceWriterE2E.integration.test.js`: PASS, 11 passed / 0 failed
- `git diff --check -- tests/dataCorrection/dataCorrectionPersistenceWriterE2E.integration.test.js docs/task-673-data-correction-persistence-writer-contract-e2e-compatibility-test-no-runtime-change-no-db.md`: PASS
