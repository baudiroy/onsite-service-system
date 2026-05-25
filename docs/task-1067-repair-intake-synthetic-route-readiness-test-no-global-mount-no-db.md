# Task1067 - Repair Intake Synthetic Route Readiness Test / No Global Mount No DB

## Scope

Task1067 adds a synthetic route readiness unit test for the Repair Intake draft-to-case branch.

Allowed files:

- `tests/repairIntake/repairIntakeSyntheticRouteReadiness.unit.test.js`
- `docs/task-1067-repair-intake-synthetic-route-readiness-test-no-global-mount-no-db.md`

Read-only references:

- `src/repairIntake/repairIntakeSyntheticAppCompositionHarness.js`
- `src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js`

## Readiness Coverage

The test uses `createRepairIntakeSyntheticAppCompositionHarness` as the top-level entrypoint and verifies:

- harness builds with a safe base path
- mounted route summaries expose only safe metadata
- the expected `POST` plan route is present
- the expected `POST` submit route is present
- `POST` plan returns a sanitized plan response
- `POST` submit with valid preconditions returns a sanitized submit response
- unknown `POST` path returns a sanitized route-not-found envelope
- unsupported method on a known path returns a sanitized method-not-allowed envelope
- source-level future-mount safety invariants remain in place
- dispatch uses only `handleSyntheticRequest`
- metadata and responses do not expose handlers, raw ports, raw requests, raw rows, SQL/DB markers, credentials, customer data, LINE markers, `finalAppointmentId`, stack traces, or raw internals

## Verification

Required commands:

- `node --test tests/repairIntake/repairIntakeSyntheticRouteReadiness.unit.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarnessSmokeBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.smoke.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarnessBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.unit.test.js`
- `git diff --name-only`
- `git diff --cached --name-only`

## Non-Goals

- No production source changes.
- No existing test changes.
- No global app mount.
- No production route registration.
- No listener startup.
- No DB, SQL, migration, `psql`, or `db:migrate`.
- No real repository implementation or repository writer.
- No API shape change.
- No admin change.
- No provider sending.
- No AI / RAG.
- No billing, settlement, payment, or invoice.
- No staging, cleanup, revert, reset, stash, or commit.
