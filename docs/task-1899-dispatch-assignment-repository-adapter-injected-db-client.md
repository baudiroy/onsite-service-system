# Task1899 Dispatch Assignment Repository Adapter

Status: implemented and verified locally without DB execution.

## Scope

Task1899 adds the bounded Admin Dispatch assignment SQL repository adapter for future runtime wiring. The adapter is intentionally injected-client-only and is not mounted into the app, server, route, controller, or service layer in this task.

Changed files:

- `src/repositories/DispatchAssignmentSqlRepositoryAdapter.js`
- `tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapter.unit.test.js`
- `tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapterBoundary.static.test.js`
- `docs/task-1899-dispatch-assignment-repository-adapter-injected-db-client.md`

## Repository adapter contract

Adapter kind:

- `admin_dispatch.dispatch_assignment_sql_repository_adapter`

Factory:

- `createDispatchAssignmentSqlRepositoryAdapter({ dbClient })`

Public methods:

- `findAssignmentState(input)`
- `recordAssignmentIntent(input)`

The adapter accepts only an injected `dbClient` with `query` or `execute`. It does not construct a pool, read environment variables, or import runtime app/server modules.

## Implemented behavior

Read path:

- Reads one dispatch assignment by `assignmentId` and `organizationId`, or by `caseId` and `organizationId`.
- Joins `cases` to enforce organization isolation.
- Filters soft-deleted assignment and case rows.
- Returns a normalized, camelCase assignment envelope.
- Returns a safe not-found-or-denied envelope when no row is visible.

Write path:

- Records a bounded dispatch assignment intent by `assignmentId` and `organizationId`.
- Allows updating dispatch unit, assigned engineer, dispatch status, assignment note, and reassignment audit columns already present in the existing schema.
- Requires `actorId` for write intent.
- Joins `cases` to preserve organization isolation.
- Returns a normalized write envelope and does not expose DB result rows.

## Safety properties

- Injected DB client only.
- Synthetic DB client tests only.
- Parameterized SQL query specs only.
- No real DB connection.
- No DATABASE_URL usage.
- No global pool construction.
- No BaseRepository import.
- No app/server import.
- No route/controller/service mounting.
- No migration execution.
- No runtime start.
- No seed execution.
- No Zeabur/deploy/smoke action.
- No provider sending.
- No billing, AI/RAG, LINE, SMS, email, webhook, or storage execution.
- No Completion Report / Field Service Report creation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.

## Organization isolation

Both read and write SQL paths join `dispatch_assignments` to `cases` and require `c.organization_id = $2::uuid`. The adapter intentionally returns the same safe not-found-or-denied reason for absent and out-of-organization rows so callers do not leak cross-organization existence.

## Result envelopes

Success envelopes include:

- `ok`
- `found`
- `written`
- `adapterKind`
- `reasonCode`
- `requestId`
- `assignment`

Failure envelopes include:

- `ok`
- `found`
- `written`
- `adapterKind`
- `reasonCode`
- `requestId`

Failure envelopes do not include thrown error messages, SQL text, DB credentials, stack traces, raw DB rows, provider payloads, or publication payloads.

## Verification

Targeted tests:

- `node --test tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapter.unit.test.js tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapterBoundary.static.test.js`

Related dispatch baseline tests:

- `node --test tests/historicalDirtyStack/appointmentDispatchHistoricalSourceBaseline.unit.test.js tests/historicalDirtyStack/appointmentDispatchCreateAppointmentHistoricalSource.unit.test.js`

Static syntax/check fallback when npm is unavailable:

- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`

Project check:

- `npm run check`

If `npm` is unavailable in the active shell, the npm check cannot run there; the static syntax fallback above is the documented replacement for this task.

## Next task recommendation

The next PM-scoped task can wire this adapter into a dispatch assignment service boundary or continue toward Task1900, but only after PM acceptance. Any route/runtime mounting, real DB execution, migration apply, seed, smoke, Zeabur/deploy, provider, billing, or customer-visible behavior remains behind a separate explicit gate.
