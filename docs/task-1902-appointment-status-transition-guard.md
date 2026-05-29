# Task1902 Appointment Status Transition Guard

Status: implemented and verified locally without DB execution.

## Scope

Task1902 adds a pure appointment status transition guard for Admin Dispatch assignment flows. It does not mount any route, call a repository, connect to a database, or start runtime.

Changed files:

- `src/guards/AppointmentStatusTransitionGuard.js`
- `tests/adminDispatch/appointmentStatusTransitionGuard.unit.test.js`
- `tests/adminDispatch/appointmentStatusTransitionGuardBoundary.static.test.js`
- `docs/task-1902-appointment-status-transition-guard.md`

## Guard contract

Guard kind:

- `admin_dispatch.appointment_status_transition_guard`

Pure function:

- `evaluateAppointmentStatusTransition(input)`

The guard accepts synthetic input describing appointment status, target status, admin actor context, organization context, and assignment visibility/eligibility. It returns a safe allow/deny envelope and does not perform writes.

## Implemented behavior

The guard fails closed for:

- Missing admin actor context.
- Missing organization context.
- Unknown current status.
- Unsupported target status.
- Invalid transition.
- Cancelled, completed, no-show, closed, or finalized current appointment states.
- Appointment organization mismatch.
- Assignment organization mismatch.
- Assignment not visible or not eligible.
- Mutation intents that attempt to include out-of-scope report, publication, provider, or final appointment fields.

Allowed synthetic transition intents return:

- `transitionIntent`
- `mutationIntent`

The mutation intent includes only:

- `appointmentStatus`
- `updatedBy`

## Safety properties

- Pure guard.
- Synthetic tests only.
- No real DB connection.
- No DATABASE_URL usage.
- No route mount changes.
- No app/server import.
- No repository import.
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

## Organization isolation

The guard requires an organization id and checks both appointment and assignment organization ids when present. Mismatch returns a safe deny envelope and never produces a mutation intent.

## Verification

Targeted tests:

- `node --test tests/adminDispatch/appointmentStatusTransitionGuard.unit.test.js tests/adminDispatch/appointmentStatusTransitionGuardBoundary.static.test.js`

Related dispatch/appointment tests:

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

Task1903 can harden the Admin Dispatch organization isolation runtime contract across route, service, and repository boundaries. Real DB execution, migrations, seed, dispatch smoke, Zeabur/deploy, provider execution, billing, AI/RAG, Completion Report / Field Service Report behavior, finalAppointmentId mutation, and customer-visible publication behavior remain behind separate explicit gates.
