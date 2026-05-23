# Task 687 — Data Correction Persistence Repository E2E Compatibility Test / No Runtime Change / No DB

## Scope

Task687 adds an end-to-end compatibility test for the Data Correction persistence repository skeleton.

This task does not modify runtime source, does not connect to a database, does not execute SQL, does not apply or dry-run a migration, and does not add routes, smoke tests, provider sending, or real persistence.

## Coverage

Added `tests/dataCorrection/dataCorrectionPersistenceRepositoryE2E.integration.test.js`.

The test verifies:

- repository default writer set fail-closes and does not call the executor
- `allowNonExecutableForTest=true` synthetic writer set calls the injected executor
- `createApp({ dataCorrection: repository.getWriterSet() })` works for pre-departure apply
- post-departure freeze writes contact log, dispatch note, and audit through the repository
- unable-to-complete writes appointment result, evidence, and audit through the repository
- follow-up proposal writes follow-up draft, dispatch note, and audit through the repository
- phone correction returns re-verification and does not write correction application
- AI role is denied before repository executor is called
- executor throw returns safe failure without raw error leak
- executor receives only safe query specs with no raw phone, raw address, raw LINE id, token, secret, DB URL, internal note, AI raw payload, or finalAppointmentId
- `createServerBootstrap({ dataCorrection: repository.getWriterSet() })` works without `listen`
- `options.app` priority bypasses repository writer path

## Boundaries

- No runtime source change.
- No API change.
- No DB connection.
- No SQL execution.
- No migration change, apply, or dry-run.
- No permission runtime service change.
- No real audit log writer runtime.
- No smoke test.
- No provider / AI sending.
- No sensitive data.

## Future Task

Future tasks may decide whether to wire executable query specs to a real injected DB client, but that requires separate authorization for migration status, DB client injection, executable spec behavior, and broader test coverage.
