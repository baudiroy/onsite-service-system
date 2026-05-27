# Task1756 - Engineer Mobile Workbench Read-Only DB Query Design Contract / No DB Execution / No Migration

Status: completed locally / design contract only / no DB execution / no migration.

## Scope

Task1756 defines the future DB query contract for the Engineer Mobile Workbench assigned appointment repository. It is DB-adjacent design and static-test coverage only.

Allowed files:

- `docs/task-1756-engineer-mobile-workbench-read-only-db-query-design-contract-no-db-no-migration.md`
- `tests/engineerMobile/engineerMobileAssignedAppointmentDbQueryContract.static.test.js`

No runtime source was modified.

## Future Repository Methods

Any future DB-backed repository must implement the same methods already protected by the Task1750 repository guard or an equivalent scoped guard:

- `findAssignedAppointments({ organizationId, engineerUserId, ...safeFilters })`
- `findAssignedAppointmentDetail({ organizationId, engineerUserId, appointmentId })`

These methods are read-only repository methods. They must return data that can be passed through the existing Engineer Mobile Workbench projection normalizer and safe envelope sanitizer.

## Required Query Scoping

Every future query must fail closed unless its scoped input is complete.

List query requirements:

- Every list query must filter by `organizationId`.
- Every list query must filter by `engineerUserId`.
- Safe filters may include date range or appointment status only after normalization by the repository guard or an equivalent scoped boundary.

Detail query requirements:

- Every detail query must filter by `organizationId`.
- Every detail query must filter by `engineerUserId`.
- Every detail query must filter by `appointmentId`.

The future repository must not depend on caller-provided organization, engineer, or appointment values unless they have already passed the injected context resolver and Task1750 repository guard or equivalent scoped guard.

## Read-Only Query Intent

Future DB behavior is SELECT-only intent.

Allowed future query shape:

- parameterized SELECT-style reads only
- organization-scoped reads
- engineer-scoped reads
- appointment-specific detail reads
- bounded safe filters
- no raw value interpolation

Forbidden future query shape:

- no insert/update/delete/upsert
- no workflow transition writes
- no Case write
- no Appointment write
- no Completion Report creation or update
- no Field Service Report creation or update
- no Field Service Report publish or submit path
- no audit persistence writer
- no provider sending side effect

Task1756 does not authorize SQL execution, DB connection, DB dry-run, migration dry-run, migration apply, schema change, index change, DDL, DML, or psql.

## Safe Selected Fields

Future selected fields must align with the Task1748 projection normalizer and the accepted Engineer Mobile Workbench projection boundary. The future repository should select or alias only fields that can map to these safe output fields:

- `appointmentId`
- `caseReference`
- `appointmentWindow`
- `scheduledStart`
- `scheduledEnd`
- `serviceType`
- `customerDisplayName`
- `locationLabel`
- `status`
- `priorityLabel`
- `serviceSummary`
- `publicCustomerNotes`
- `checklistPreview`

The repository may use internal DB columns to compute these safe fields, but it must not return raw internal rows to handlers or adapters. Returned objects must already be compatible with the projection normalizer and safe envelope sanitizer.

## Forbidden Selected Fields

Future repository output must not select, return, alias, or leak:

- `finalAppointmentId`
- `final_appointment_id`
- raw SQL/debug fields
- raw DB rows
- provider/debug/private fields
- token
- secret
- password
- cookie
- authorization header
- raw session
- raw user object
- internal notes
- raw phone
- raw address
- unfiltered customer phone/address unless a future safe projection decision explicitly allows it
- AI/RAG/vector payload
- billing or settlement internals

## Guard Placement

The future DB repository must sit behind the Task1750 repository guard or an equivalent scoped guard.

The guard must remain responsible for:

- requiring `organizationId`
- requiring `engineerUserId`
- requiring `appointmentId` for detail reads
- normalizing safe filters
- blocking unsafe delegate input
- failing closed on missing scope or delegate failure
- preventing raw error leakage

The repository must remain injected. It must not import app/server/bootstrap files, mount routes, call `listen`, read environment variables, or create a global DB client.

## Non-goals

- No source/runtime changes.
- No DB execution.
- No SQL execution.
- No DB connection.
- No psql.
- No `db:migrate`.
- No migration creation.
- No migration dry-run.
- No migration apply.
- No schema/index changes.
- No DDL or DML.
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
- No broad staging.
- No commit or push in this task.
- No cleanup of held historical docs.

## Preserved Core Boundaries

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- This DB query contract must not create a second formal Field Service Report.
- This DB query contract does not authorize Field Service Report creation, update, publish, or submit behavior.

## Verification

Commands run:

```bash
node --test tests/engineerMobile/engineerMobileAssignedAppointmentDbQueryContract.static.test.js
npm run check
git diff --check -- tests/engineerMobile/engineerMobileAssignedAppointmentDbQueryContract.static.test.js docs/task-1756-engineer-mobile-workbench-read-only-db-query-design-contract-no-db-no-migration.md
```

Results:

- Task1756 static test: PASS.
- `npm run check`: PASS.
- `git diff --check`: PASS.
- Credential scan on Task1756 changed files: clean.
