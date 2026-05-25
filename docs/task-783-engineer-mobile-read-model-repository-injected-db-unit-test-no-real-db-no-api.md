# Task783 - Engineer Mobile Read Model Repository / Injected DB Unit Test / No Real DB No API

Status: completed

Scope: injected repository slice / no real DB / no API behavior change

## Purpose

Task783 adds the first bounded Engineer Mobile repository-read slice after the Migration 022 no-DB readiness closure.

The new repository accepts only an injected `dbClient` or `transaction` query boundary. It does not import a global DB pool, does not connect to a real database, does not change API routes, and does not implement completion writes.

## Changed Files

- `src/engineerMobile/engineerMobileReadModelRepository.js`
- `tests/engineerMobile/engineerMobileReadModelRepository.unit.test.js`
- `docs/task-783-engineer-mobile-read-model-repository-injected-db-unit-test-no-real-db-no-api.md`

## Repository Boundary

The repository:

- reads from the future Migration 022 read-model table name `engineer_mobile_task_read_models`
- uses Migration 022 safe read-model column names
- requires injected `dbClient` or `transaction`
- supports task list and task detail reads
- maps rows through existing safe Engineer Mobile read-model mappers
- returns safe empty list / not-found detail on missing injection, malformed rows, empty rows, or thrown query errors

The repository does not:

- import global DB connection code
- import environment or config
- import provider / LINE / SMS / App push / webhook runtime
- import AI/RAG runtime
- import API routes, controllers, services, app, or server files
- create or update Field Service Reports
- mutate `finalAppointmentId`
- send notifications
- write audit/contact/correction records

## Test Coverage

`tests/engineerMobile/engineerMobileReadModelRepository.unit.test.js` covers:

- exports and Migration 022 read-model metadata
- missing injected DB client fail-closed behavior
- injected fake DB task list reads
- injected fake transaction task detail reads
- `getReadModel` list/detail dispatch
- malformed and thrown DB results fail-closed without raw error leaks
- missing required organization / engineer / appointment scope fail-closed before query call
- source import boundary avoids runtime sinks

The tests use sanitized fixture-style rows and deliberately add unsafe extra fields to prove output still excludes sensitive/internal values.

## Sensitive Output Boundary

Repository output must not expose:

- DB URL
- token
- secret
- raw LINE id
- full phone
- full address
- internal note
- audit raw payload
- AI raw payload
- billing/settlement internals
- full payload
- Field Service Report id
- formal report id
- `finalAppointmentId`

## Core Invariants

Task783 preserves:

- one Case = one formal completion report
- multiple appointments / dispatch visits per Case
- Engineer Mobile read model does not decide `finalAppointmentId`
- `finalAppointmentId` remains backend/system-owned
- no engineer manual selection of `finalAppointmentId`

## Runtime Decision

No real DB connection.

No psql.

No db:migrate.

No DDL.

No dry-run.

No apply.

No API behavior change.

No provider behavior.

No AI/RAG behavior.

No completion/report write behavior.

No smoke/integration test change.

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobileReadModelRepository.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileReadModelRepository.js tests/engineerMobile/engineerMobileReadModelRepository.unit.test.js docs/task-783-engineer-mobile-read-model-repository-injected-db-unit-test-no-real-db-no-api.md
```

## Future Tasks

Future candidates require separate explicit approval:

- Wire repository into an API/service boundary.
- Add real DB executor configuration after Migration 022 dry-run/apply approval.
- Add assignment/permission runtime around repository usage.
- Add audit evidence for task reads if required by a later ISO controls task.
- Add mobile completion submission runtime.
- Add provider/notification sending.
- Add AI/RAG helper layer.
- Add smoke/integration coverage.
