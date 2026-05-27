# Task1760 - Engineer Mobile Assigned Appointment DB Repository Adapter / Injected Query Executor / No DB Execution

Status: completed locally / bounded runtime repository adapter / synthetic executor only.

## Scope

Task1760 adds a DB repository adapter for Engineer Mobile assigned appointments. The adapter uses the accepted Task1758 pure SQL query builder, but it receives all execution capability through an injected `queryExecutor`.

Modified files:

- `src/engineerMobile/engineerMobileAssignedAppointmentDbRepository.js`
- `tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js`
- `docs/task-1760-engineer-mobile-assigned-appointment-db-repository-adapter-injected-query-executor-no-db-execution.md`

## Runtime Surface

The new runtime file exports:

- `createEngineerMobileAssignedAppointmentDbRepository(options)`
- `SAFE_REPOSITORY_ADAPTER_ERROR_MESSAGE`

The repository exposes the existing read-only contract expected by the Task1750 repository guard and Engineer Mobile handlers:

- `findAssignedAppointments({ organizationId, engineerUserId, filters })`
- `findAssignedAppointmentDetail({ organizationId, engineerUserId, appointmentId })`

The adapter uses Task1758 builders by default:

- `buildEngineerMobileAssignedAppointmentListQuerySpec`
- `buildEngineerMobileAssignedAppointmentDetailQuerySpec`

Tests may inject a replacement query builder. Runtime execution remains injected-only.

## Injected Executor Boundary

The adapter requires a `queryExecutor` function or object. It does not import DB clients, pools, env DB URLs, app/server/routes, providers, or repository implementations.

The adapter:

- builds a Task1758 query spec
- passes only the query spec into the injected executor
- normalizes executor results from arrays or `{ rows: [...] }`
- returns list rows as an array
- returns detail data as the first row
- treats missing or invalid executor results as empty data

Task1760 does not authorize real DB execution. All verification used synthetic executors only.

## Fail-Closed Behavior

The repository fails closed on:

- missing `queryExecutor`
- missing `organizationId`
- missing `engineerUserId`
- missing `appointmentId` for detail reads
- query builder failure
- fail-closed query specs
- executor throw

Failures throw only `engineerMobile.assignedAppointmentDbRepository.unavailable`. Raw executor errors, stack traces, SQL internals, DB connection details, env vars, credentials, request/session/user objects, and debug payloads are not leaked.

## Audit Metadata

If an optional audit logger is injected, it receives safe read metadata only:

- event name
- method
- outcome
- organization id
- engineer user id
- appointment id when applicable
- row count when available
- safe reason code on deny

Audit logging is optional and cannot widen read behavior or make the repository unavailable.

## Non-goals

- No real DB connection.
- No real SQL execution.
- No psql.
- No `db:migrate`.
- No migration creation.
- No migration apply.
- No DDL.
- No schema/index changes.
- No smoke.
- No global route mount.
- No `src/app.js`.
- No `src/server.js`.
- No `src/routes/**`.
- No provider sending.
- No LINE / SMS / email / webhook.
- No AI / RAG.
- No billing / settlement.
- No admin UI.
- No package changes.
- No commit or push in this task.
- No cleanup of held historical docs.

## Preserved Core Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- This repository adapter cannot create a second formal Field Service Report.
- This task does not create, update, submit, publish, or persist a Field Service Report.

## Verification

Commands run:

```bash
node --test tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileAssignedAppointmentDbRepository.js tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js docs/task-1760-engineer-mobile-assigned-appointment-db-repository-adapter-injected-query-executor-no-db-execution.md
```

Results:

- Task1760 DB repository adapter unit test: PASS.
- `npm run check`: PASS.
- `git diff --check`: PASS.
- Credential scan on Task1760 changed files: clean.
