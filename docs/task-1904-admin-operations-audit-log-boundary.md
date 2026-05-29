# Task1904 Admin Operations Audit Log Boundary

Status: implemented and verified locally without DB execution.

## Scope

Task1904 adds an internal-only Admin Dispatch audit boundary using an injected audit writer. It does not connect to a database, import the app/server, mutate assignment or appointment state, or send providers.

Changed files:

- `src/guards/AdminDispatchAuditBoundary.js`
- `tests/adminDispatch/adminDispatchAuditBoundary.unit.test.js`
- `tests/adminDispatch/adminDispatchAuditBoundary.static.test.js`
- `docs/task-1904-admin-operations-audit-log-boundary.md`

## Boundary contract

Boundary kind:

- `admin_dispatch.operations_audit_boundary`

Functions:

- `buildAdminDispatchAuditEvent(input)`
- `createAdminDispatchAuditBoundary({ auditWriter })`

The audit boundary accepts safe synthetic metadata and returns an internal-only audit event. The writer is injected as a function or object with `write`/`record`.

## Safe metadata

Audit events may include only:

- event/action type
- organizationId
- assignmentId
- appointmentId
- caseId
- adminActorId
- dispatcherActorId
- requestId
- permission/action decision
- transition/assignment intent status
- occurredAt

Audit events are marked:

- `internalOnly: true`
- `customerVisible: false`

## Failure behavior

The boundary fails closed for:

- Missing audit writer.
- Missing action.
- Missing organization id.
- Missing admin/dispatcher actor id.
- Forbidden raw payload fields.
- Audit writer failure.

Audit writer failure returns a sanitized result and does not expose raw errors, stack traces, SQL, credentials, provider payloads, or customer data.

## Safety properties

- Injected audit writer.
- Synthetic tests only.
- Internal-only.
- Sanitized.
- No real DB connection.
- No DATABASE_URL usage.
- No global audit repository construction.
- No app/server import.
- No route mount changes.
- No migration execution.
- No runtime start.
- No seed execution.
- No dispatch smoke.
- No Zeabur/deploy action.
- No provider sending.
- No billing, AI/RAG, LINE, SMS, email, webhook, or storage execution.
- No Completion Report / Field Service Report creation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.

## Verification

Targeted tests:

- `node --test tests/adminDispatch/adminDispatchAuditBoundary.unit.test.js tests/adminDispatch/adminDispatchAuditBoundary.static.test.js`

Related admin dispatch tests:

- `node --test tests/adminDispatch/dispatchOrganizationIsolationContract.unit.test.js tests/adminDispatch/dispatchOrganizationIsolationContractBoundary.static.test.js`
- `node --test tests/adminDispatch/appointmentStatusTransitionGuard.unit.test.js tests/adminDispatch/appointmentStatusTransitionGuardBoundary.static.test.js`
- `node --test tests/adminDispatch/dispatchAssignmentRoutePermissionGuard.unit.test.js tests/adminDispatch/dispatchAssignmentRoutePermissionGuardBoundary.static.test.js`
- `node --test tests/adminDispatch/dispatchAppointmentAssignmentService.unit.test.js tests/adminDispatch/dispatchAppointmentAssignmentServiceBoundary.static.test.js`
- `node --test tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapter.unit.test.js tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapterBoundary.static.test.js`
- `node --test tests/historicalDirtyStack/appointmentDispatchHistoricalSourceBaseline.unit.test.js tests/historicalDirtyStack/appointmentDispatchCreateAppointmentHistoricalSource.unit.test.js`

Static syntax/check fallback when npm is unavailable:

- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`

Project check:

- `npm run check`

If `npm` is unavailable in the active shell, the npm check cannot run there; the static syntax fallback above is the documented replacement for this task.

## Next task recommendation

Task1905 can add the Admin Dispatch Zeabur smoke readiness plan only. It must not run smoke, probe Zeabur dispatch endpoints, connect to DB, deploy, modify Zeabur env vars, print secrets, or mutate assignment/appointment/report state.
