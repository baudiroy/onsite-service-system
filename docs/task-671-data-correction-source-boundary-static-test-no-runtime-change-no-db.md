# Task 671 - Data Correction Source Boundary Static Test / No Runtime Change / No DB

## Scope

Task671 adds a static source boundary test for the Data Correction Phase 1 runtime files.

This task changes tests and task documentation only. It does not modify runtime source.

## Test Purpose

The static test prevents accidental dependency drift before real persistence is introduced. It verifies that Data Correction Phase 1 remains isolated from:

- DB / repository / transaction modules
- provider / LINE / SMS / Email / App push modules
- AI / RAG / vector / OpenAI modules
- app/server direct imports
- unsafe logging of payload/request/env/config
- suspicious Field Service Report, appointment, case, or `finalAppointmentId` mutation patterns

## Dependency Direction

The expected dependency direction is:

- route -> controller + permission middleware
- controller -> orchestrator
- orchestrator -> Data Correction services
- services -> policy/request services/constants only
- no DB/provider/AI imports

## Coverage Added

The static test verifies:

- All expected Data Correction Phase 1 source files exist.
- Data Correction source files do not import DB, repository, transaction, provider, LINE, SMS, Email, App push, AI, RAG, vector, or OpenAI modules.
- Data Correction services do not import route, controller, app, or server modules.
- Route imports only the controller and permission middleware.
- Controller imports only the orchestrator.
- Orchestrator imports only Data Correction services.
- No Data Correction source file reads `process.env`.
- No Data Correction source file uses console logging.
- No Data Correction source file logs payload/request/env/config through logger-style calls.
- No raw sensitive keys are echoed into response or writer output patterns.
- No suspicious official mutation patterns appear for Field Service Report creation, appointments, cases, or `finalAppointmentId`.

## Explicit Non-goals

- No runtime source change.
- No API change.
- No DB connection.
- No repository, transaction, migration, or schema change.
- No permission runtime service.
- No real audit/contact/evidence/parts writer runtime.
- No provider, LINE, SMS, Email, App push, notification, AI, RAG, or vector runtime.
- No admin frontend change.
- No smoke, browser, fixture, package, guardrails, short-instruction, design-doc, task-index, or README change.

## Future Tasks

- Any future DB/repository/provider/AI integration must be separately scoped and should update this static boundary test deliberately.
- Any future official persistence task must preserve no raw sensitive echo and no accidental `finalAppointmentId` mutation.
- Real audit/contact/evidence/parts writers should keep dependency direction explicit.

## Verification

Planned verification commands:

- `node --test tests/dataCorrection/dataCorrectionSourceBoundary.static.test.js`
- `git diff --check -- tests/dataCorrection/dataCorrectionSourceBoundary.static.test.js docs/task-671-data-correction-source-boundary-static-test-no-runtime-change-no-db.md`
