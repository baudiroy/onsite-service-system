# Task 931 - Engineer Mobile Pre-Departure Eligibility Projection Delegation / No State Change

## Status

Completed locally.

## Goal

Wire the Task930 pure pre-departure eligibility evaluator into the existing Engineer Mobile assigned appointment list and detail projections.

This task only computes read-only display hints. It does not execute travel, arrival, completion, or report workflow actions.

## Modified Files

- `src/engineerMobile/engineerAssignedAppointmentsProjectionService.js`
- `src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js`
- `tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentsProjectionServiceClosure.static.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailProjectionServiceClosure.static.test.js`
- `tests/engineerMobile/engineerPreDepartureEligibilityProjectionDelegation.static.test.js`
- `docs/task-931-engineer-mobile-pre-departure-eligibility-projection-delegation-no-state-change.md`

Task931 reuses the existing pure helper in:

- `src/engineerMobile/engineerPreDepartureActionEligibility.js`

No `admin/src/`, `README.md`, `migrations/`, production route/controller/bootstrap/server/listen files, auth/session/JWT runtime files, real DB/repository/transaction files, provider files, AI/RAG/vector/search files, billing/settlement files, package/env/config/credential files, smoke/shared runtime infrastructure, Customer Access Task908-Task920 files, staging, or commit was modified for Task931.

## Behavior

Both projection services now call:

```js
evaluateEngineerPreDepartureActionEligibility({ engineerContext, appointment })
```

The projections map only the helper's safe boolean hints:

- `canStartTravel`
- `canRecordArrival`
- `canPrepareCompletionDraft`

The projections do not expose helper `reasons`.

The list projection now includes all three hint booleans for projected appointments. The detail projection keeps the same three hint keys and now sources them from the shared helper.

## Boundaries

- Read-only projection helper delegation only.
- Existing injected `dbClient.query` projection flow remains intact.
- Existing pre-resolved `engineerContext` requirement remains intact.
- Existing organization and assigned engineer scoping remains intact.
- Projection output remains allowlist-only.
- Eligibility output is display hints only.
- No state mutation.
- No DB/repository changes.
- No route/controller/API rollout.
- No auth/session/JWT runtime.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No migration.
- No smoke/shared runtime.
- No start travel action.
- No arrival action.
- No completion/report action.
- No Appointment/Case/FSR/Completion Report/customer identity/provider state/`finalAppointmentId` mutation or exposure.

## Test Coverage

Task931 unit coverage proves:

- list projection keeps allowlisted appointment projection fields;
- list projection delegates `canStartTravel`, `canRecordArrival`, and `canPrepareCompletionDraft` to the Task930 helper;
- detail projection delegates `canStartTravel`, `canRecordArrival`, and `canPrepareCompletionDraft` to the Task930 helper;
- helper reasons are not exposed by projections;
- sensitive/internal fields and `finalAppointmentId` do not leak;
- context and row objects are not mutated;
- existing read-only injected `dbClient.query` behavior remains intact.

Task931 static coverage proves:

- list/detail projection services import only `./engineerPreDepartureActionEligibility`;
- list/detail projections call `evaluateEngineerPreDepartureActionEligibility`;
- no DB/repository/auth/provider/AI/billing/route/listen/env/network dependency import was added;
- no mutation SQL or workflow action execution path was added;
- projection mappers remain allowlist-only;
- `finalAppointmentId` remains excluded.

## Verification

Commands to run:

```bash
node --test tests/engineerMobile/engineerPreDepartureEligibilityProjectionDelegation.static.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js
node --test tests/engineerMobile/engineerPreDepartureActionEligibility.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/engineerMobile tests/engineerMobile docs/task-931-engineer-mobile-pre-departure-eligibility-projection-delegation-no-state-change.md
```

Current results:

- `node --test tests/engineerMobile/engineerPreDepartureEligibilityProjectionDelegation.static.test.js`: PASS, 7/7.
- `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js`: PASS, 13/13.
- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js`: PASS, 14/14.
- `node --test tests/engineerMobile/engineerPreDepartureActionEligibility.unit.test.js`: PASS, 13/13.
- `node --test tests/engineerMobile/*.js`: PASS, 745/745.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 3114/3114.
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-931-engineer-mobile-pre-departure-eligibility-projection-delegation-no-state-change.md`: PASS.
