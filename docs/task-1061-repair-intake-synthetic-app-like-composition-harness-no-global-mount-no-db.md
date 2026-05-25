# Task1061 - Repair Intake Synthetic App-Like Composition Harness / No Global Mount No DB

## Scope

Task1061 adds a local synthetic app-like harness for the Repair Intake injected route-composition wrapper. The harness is test-only in behavior and does not touch the real app, server, routes, repositories, DB, providers, admin, package files, migrations, guardrails, or design docs.

Allowed files:

- `src/repairIntake/repairIntakeSyntheticAppCompositionHarness.js`
- `tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.unit.test.js`
- `docs/task-1061-repair-intake-synthetic-app-like-composition-harness-no-global-mount-no-db.md`

## Runtime Surface

The new module exports:

- `createRepairIntakeSyntheticAppCompositionHarness(options)`

The harness imports only:

- `./repairIntakeDraftToCaseInjectedRouteComposition`

It accepts:

- `runtimePorts`
- optional `basePath`

It internally creates an explicit synthetic mount target and calls:

- `createRepairIntakeDraftToCaseInjectedRouteComposition({ runtimePorts, basePath, mountTarget })`

## Behavior

- Missing or invalid `runtimePorts` fail closed.
- Successful composition returns safe harness metadata:
  - `ok`
  - `mounted`
  - `routes`
  - `basePath`
  - `reasonCode`
  - `requiredActions`
  - `handleSyntheticRequest(method, path, request)`
- `handleSyntheticRequest` dispatches only to internally mounted synthetic route handlers.
- `POST` is supported for mounted Repair Intake routes.
- Unknown routes return a sanitized route-not-found envelope.
- Unsupported methods return a sanitized method-not-allowed envelope.
- Handler errors return a sanitized compose-failed envelope.

## Sanitization

The harness summary and synthetic error envelopes do not expose raw `runtimePorts`, raw mount target internals, route handler functions, raw request objects, raw route internals, DB/SQL markers, credentials, customer data, LINE markers, `finalAppointmentId`, stack traces, or token markers.

Reason codes:

- `REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_PORTS_REQUIRED`
- `REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_COMPOSE_FAILED`
- `REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_READY`
- `REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_ROUTE_NOT_FOUND`
- `REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_METHOD_NOT_ALLOWED`

## Verification

Required commands:

- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.unit.test.js`
- `node --test tests/repairIntake/repairIntakeInjectedRouteCompositionSmokeBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js`
- `git diff --name-only`
- `git diff --cached --name-only`

## Non-Goals

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
