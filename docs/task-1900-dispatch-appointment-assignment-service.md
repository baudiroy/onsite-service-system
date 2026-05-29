# Task1900 Dispatch Appointment Assignment Service

Status: implemented and verified locally without DB execution.

## Scope

Task1900 adds the bounded Admin Dispatch appointment assignment application service. The service coordinates an injected dispatch assignment repository and stays unmounted from runtime routes in this task.

Changed files:

- `src/services/DispatchAppointmentAssignmentService.js`
- `tests/adminDispatch/dispatchAppointmentAssignmentService.unit.test.js`
- `tests/adminDispatch/dispatchAppointmentAssignmentServiceBoundary.static.test.js`
- `docs/task-1900-dispatch-appointment-assignment-service.md`

## Service contract

Service kind:

- `admin_dispatch.dispatch_appointment_assignment_service`

Factory:

- `createDispatchAppointmentAssignmentService({ assignmentRepository })`

Public method:

- `assignAppointment(input)`

The service accepts only injected repositories/dependencies. It does not construct a database client, import runtime routes, start the app/server, or run any provider.

## Implemented behavior

The service:

- Requires `dispatch.manage` permission context.
- Requires admin/dispatcher actor metadata.
- Requires an organization id.
- Requires a bounded assignment intent.
- Reads assignment visibility through the injected repository.
- Fails closed when the assignment is absent, denied, or outside the organization.
- Writes the assignment intent through the injected repository only after read eligibility passes.
- Normalizes the assignment response into a safe service envelope.
- Returns sanitized failure envelopes for missing dependency, invalid input, denied repository results, and repository/client failures.

## Safety properties

- Injected repository only.
- Synthetic tests only.
- No real DB connection.
- No DATABASE_URL usage.
- No global pool construction.
- No route wiring.
- No app/server import.
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

The service passes `assignmentId`, `organizationId`, and `requestId` to the injected repository read path before allowing any assignment intent write. It verifies the visible assignment organization before writing and after writing. Mismatch and not-found states use the same safe-deny reason so cross-organization existence is not leaked.

## Result envelopes

Success envelopes include:

- `ok`
- `assigned`
- `serviceKind`
- `reasonCode`
- `requestId`
- `assignment`
- `auditContext`

Failure envelopes include:

- `ok`
- `assigned`
- `serviceKind`
- `reasonCode`
- `requestId`

Failure envelopes do not include repository error messages, SQL text, DB credentials, stack traces, raw DB rows, provider payloads, or publication payloads.

## Verification

Targeted tests:

- `node --test tests/adminDispatch/dispatchAppointmentAssignmentService.unit.test.js tests/adminDispatch/dispatchAppointmentAssignmentServiceBoundary.static.test.js`

Related dispatch baseline tests:

- `node --test tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapter.unit.test.js tests/adminDispatch/dispatchAssignmentSqlRepositoryAdapterBoundary.static.test.js`
- `node --test tests/historicalDirtyStack/appointmentDispatchHistoricalSourceBaseline.unit.test.js tests/historicalDirtyStack/appointmentDispatchCreateAppointmentHistoricalSource.unit.test.js`

Static syntax/check fallback when npm is unavailable:

- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`

Project check:

- `npm run check`

If `npm` is unavailable in the active shell, the npm check cannot run there; the static syntax fallback above is the documented replacement for this task.

## Next task recommendation

Task1901 can add the route boundary and admin permission guard around this service using injected dependencies only. It should keep real DB execution, migrations, seed, smoke, Zeabur/deploy, provider execution, billing, AI/RAG, Completion Report / Field Service Report behavior, finalAppointmentId mutation, and customer-visible publication behavior behind separate gates.
