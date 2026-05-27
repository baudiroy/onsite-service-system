# Task1762 - Engineer Mobile Workbench Module DB Repository Adapter Integration / Injected Query Executor / No Real DB

Status: completed locally / bounded runtime integration / synthetic query executor only.

## Scope

Task1762 wires the accepted Task1760 DB repository adapter into the accepted Engineer Mobile Workbench read-only module as an opt-in injected-query-executor path.

Modified files:

- `src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js`
- `tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js`
- `tests/engineerMobile/engineerMobileActionIntentBoundary.unit.test.js`
- `tests/engineerMobile/engineerMobileReadModelBranchClosure.static.test.js`
- `docs/task-1762-engineer-mobile-workbench-module-db-repository-adapter-integration-injected-query-executor-no-real-db.md`

## Runtime Surface

The Workbench read-only module can now build its assigned appointment repository from:

- an explicit `assignedAppointmentRepository`
- an explicit `delegateAssignedAppointmentRepository` wrapped by the existing repository guard
- an injected assigned appointment query executor:
  - `assignedAppointmentQueryExecutor`
  - `assignedAppointmentDbQueryExecutor`
  - `queryExecutor`

The injected query executor path uses `createEngineerMobileAssignedAppointmentDbRepository()` from Task1760. It preserves the existing handler and adapter flow:

```text
synthetic request -> request context resolver -> Workbench module -> repository guard when enabled -> DB repository adapter -> SQL query builder -> injected synthetic queryExecutor -> projection normalizer -> safe response envelope
```

## Behavior

The new path:

- keeps the existing direct repository path working
- keeps the existing repository guard path working
- requires an injected executor before the DB repository adapter can be created
- uses the Task1760 adapter to build Task1758 list/detail query specs
- supports wrapping the DB adapter with the Task1750 repository guard
- passes only safe query specs to the injected executor
- keeps list and detail responses passing through the existing projection normalizer and safe envelope
- fails closed when no usable repository or query executor path is available
- fails closed when the executor throws

## Tests Added

`tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js` now covers:

- DB repository adapter path through an injected synthetic query executor
- canonical list route through the DB adapter path
- canonical detail route through the DB adapter path
- query spec scoping for `organizationId`, `engineerUserId`, and detail `appointmentId`
- executor input excludes raw request/session/auth/token/cookie/password/secret values
- DB adapter path wrapped by the repository guard
- missing query executor fails closed
- executor throw fails closed without raw error leak
- executor rows remain projected to safe output
- forbidden fields from executor rows do not leak

Existing tests continue to cover:

- direct `assignedAppointmentRepository` path
- repository guard path with a synthetic delegate repository
- resolver-backed request context path
- no route registration when the module is unavailable
- no mutation/listen behavior

Two historical static boundary tests now allow only the specific Task1760 adapter import from the Workbench module:

- `./engineerMobileAssignedAppointmentDbRepository`

They still reject DB clients, pools, transactions, migrations, provider sending, notifications, AI/RAG, admin, smoke, and write/report modules.

## Non-goals

- No real DB connection.
- No real SQL execution against a database.
- No psql.
- No `db:migrate`.
- No migration creation or apply.
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
- This module integration cannot create a second formal Field Service Report.
- This task does not create, update, submit, publish, or persist a Field Service Report.

## Verification

Commands run:

```bash
node --test tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js
node --test tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js
node --test tests/engineerMobile/engineerMobileActionIntentBoundary.unit.test.js tests/engineerMobile/engineerMobileReadModelBranchClosure.static.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js tests/engineerMobile/engineerMobileActionIntentBoundary.unit.test.js tests/engineerMobile/engineerMobileReadModelBranchClosure.static.test.js docs/task-1762-engineer-mobile-workbench-module-db-repository-adapter-integration-injected-query-executor-no-real-db.md
```

Results:

- Workbench read-only module unit test: PASS, 17 tests.
- DB repository adapter plus Workbench module tests: PASS, 31 tests.
- Historical static boundary plus Workbench module tests: PASS, 30 tests.
- Engineer Mobile test set: PASS, 889 tests.
- `npm run check`: PASS.
- `git diff --check`: PASS.
- Refined credential / DB URL / token scan on Task1762 changed files: clean.
