# Task1774 - Engineer Mobile DB-Adjacent Runtime Boundary Static Guard / No Runtime Change

## Scope

Task1774 adds a file-only static boundary guard for the accepted Engineer Mobile DB-adjacent read-only runtime chain from Tasks1758-1773.

Allowed scope:

- `tests/engineerMobile/**`
- `docs/task-1774-engineer-mobile-db-adjacent-runtime-boundary-static-guard-no-runtime-change.md`

No runtime/source file was modified.

## Files Changed

- Added `tests/engineerMobile/engineerMobileDbAdjacentRuntimeBoundary.static.test.js`
- Added `docs/task-1774-engineer-mobile-db-adjacent-runtime-boundary-static-guard-no-runtime-change.md`

## Guarded Files

The new static guard reads and verifies:

- `src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentDbRepository.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard.js`
- `src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js`
- `tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js`

## Guarded Boundary

The static test locks the current DB-adjacent boundary so it remains:

- injected-only
- read-only
- no real DB connection
- no real SQL execution
- no migration / DDL / schema or index changes
- no global route mount
- no provider sending
- no workflow mutation
- no forbidden field exposure

## Assertions Added

The guard verifies:

- DB-adjacent files exist.
- DB-adjacent source files do not import DB clients, app/server/routes, providers, admin, package files, or migrations.
- DB-adjacent source files do not read env DB URLs or perform real DB, global mount, provider, or workflow mutation calls.
- SQL builder remains SELECT-only, parameterized, scoped by organization / engineer / appointment, and query-spec-only.
- SQL builder keeps generated specs non-executable and frozen.
- DB repository adapter uses only the injected query executor and maps rows before returning.
- DB row mapper remains pure allowlist mapping and does not output forbidden DB fields.
- Query executor guard rejects unsafe SQL, raw SQL strings, unsafe intent, and unsafe metadata.
- Workbench module uses DB adapter and query executor guard only through opt-in injected options.
- Synthetic HTTP acceptance covers the guarded query executor path and no-mutation assertions.
- Forbidden fields remain out of DB-adjacent production sources.

## Explicit Non-Goals

Task1774 does not authorize or perform:

- source/runtime changes
- API shape changes
- real DB connection
- real SQL execution against a database
- psql
- `db:migrate`
- migration creation or apply
- DDL
- schema/index changes
- smoke
- global route mount
- provider sending
- LINE / SMS / email / webhook
- AI / RAG
- billing / settlement
- admin UI
- package changes
- commit
- push
- staging, cleaning, resetting, stashing, restoring, removing, or committing the 7 held historical docs

## Core Invariants

Task1774 preserves these project boundaries:

- One Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains system-owned except explicit admin override.
- A Case may still have multiple appointments and dispatch visits.
- Appointment / dispatch / FSR review must not create a second formal Field Service Report.

## Verification

Verification commands were run after adding the static guard:

```bash
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileDbAdjacentRuntimeBoundary.static.test.js
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileDbAdjacentRuntimeBoundary.static.test.js tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js
/Users/global/.nvm/versions/node/v24.16.0/bin/node /Users/global/.nvm/versions/node/v24.16.0/lib/node_modules/npm/bin/npm-cli.js run check
git diff --check -- tests/engineerMobile/engineerMobileDbAdjacentRuntimeBoundary.static.test.js docs/task-1774-engineer-mobile-db-adjacent-runtime-boundary-static-guard-no-runtime-change.md
```

Results are recorded in the PM completion report.
