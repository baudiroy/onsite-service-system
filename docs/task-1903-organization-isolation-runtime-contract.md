# Task1903 Organization Isolation Runtime Contract

Status: implemented and verified locally without DB execution.

## Scope

Task1903 adds a pure Admin Dispatch Organization isolation runtime contract helper plus unit/static tests proving the route, service, and repository layers require organization boundaries and fail closed when the boundary is absent or mismatched.

Changed files:

- `src/guards/DispatchOrganizationIsolationContract.js`
- `tests/adminDispatch/dispatchOrganizationIsolationContract.unit.test.js`
- `tests/adminDispatch/dispatchOrganizationIsolationContractBoundary.static.test.js`
- `docs/task-1903-organization-isolation-runtime-contract.md`

Referenced boundary files:

- `src/routes/dispatchAssignment.routes.js`
- `src/services/DispatchAppointmentAssignmentService.js`
- `src/repositories/DispatchAssignmentSqlRepositoryAdapter.js`

## Contract helper

Contract kind:

- `admin_dispatch.organization_isolation_runtime_contract`

Pure function:

- `evaluateDispatchOrganizationIsolationContract(input)`

The helper verifies a bounded synthetic contract:

- Admin actor metadata is present.
- Organization id is present.
- `dispatch.manage` permission context is present.
- No global organization fallback is accepted.
- Repository query specs include `JOIN cases AS c ON c.id = da.case_id`.
- Repository query specs include `c.organization_id = $2::uuid`.
- Repository query spec values carry the expected organization id at the organization placeholder.
- Visible assignment organization matches the active organization when present.

## Runtime contract evidence

The tests prove:

- Route input built by `buildServiceInput` carries authenticated actor organization and `dispatch.manage` permission context.
- Task1900 service denies missing organization before repository write.
- Task1899 repository read and write query specs carry the organization predicate and cases join.
- Cross-organization assignment data safe-denies without raw data exposure.
- A global organization fallback is rejected.
- Repository specs that omit the organization predicate are rejected.

## Safety properties

- Pure helper.
- Synthetic tests only.
- No real DB connection.
- No DATABASE_URL usage.
- No route mount changes.
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

## Verification

Targeted tests:

- `node --test tests/adminDispatch/dispatchOrganizationIsolationContract.unit.test.js tests/adminDispatch/dispatchOrganizationIsolationContractBoundary.static.test.js`

Related admin dispatch tests:

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

Task1904 can proceed only after PM acceptance. Real DB execution, migrations, seed, dispatch smoke, Zeabur/deploy, provider execution, billing, AI/RAG, Completion Report / Field Service Report behavior, finalAppointmentId mutation, and customer-visible publication behavior remain behind separate explicit approval gates.
