# Task 930 - Engineer Mobile Pre-Departure Action Eligibility Evaluator / Pure Helper / No State Change

## Status

Completed locally.

## Goal

Add a pure eligibility evaluator for future Engineer Mobile pre-departure display hints, starting with whether an engineer may see a Start Travel capability.

This task does not perform the action. It only computes safe eligibility hints.

## Modified Files

- `src/engineerMobile/engineerPreDepartureActionEligibility.js`
- `tests/engineerMobile/engineerPreDepartureActionEligibility.unit.test.js`
- `tests/engineerMobile/engineerPreDepartureActionEligibilityClosure.static.test.js`
- `docs/task-930-engineer-mobile-pre-departure-action-eligibility-evaluator-pure-helper-no-state-change.md`

No Task921 or Task925 projection delegation was made in this task, so existing read-only projection output shape remains unchanged.

No `admin/src/`, `README.md`, `migrations/`, production route/controller/bootstrap/server/listen files, auth/session/JWT runtime files, real DB/repository/transaction files, provider files, AI/RAG/vector/search files, billing/settlement files, package/env/config/credential files, smoke/shared runtime infrastructure, Customer Access Task908-Task920 files, staging, or commit was modified for Task930.

## Behavior

`evaluateEngineerPreDepartureActionEligibility({ engineerContext, appointment })` returns:

```js
{
  ok: true,
  canStartTravel: true,
  canRecordArrival: false,
  canPrepareCompletionDraft: false,
  reasons: []
}
```

Denied results use the same safe shape with `ok: false`, all capabilities false, and a generic enum-like reason.

The evaluator:

- requires `engineerContext`;
- requires `organizationId`;
- requires `engineerId`;
- requires an appointment-like object;
- requires organization match;
- requires assigned engineer match;
- requires assigned appointments read permission, Workbench read permission, or equivalent safe flag;
- allows `canStartTravel` for `assigned`, `scheduled`, `confirmed`, and `ready_to_start`;
- denies `travel_started`, `traveling`, `arrived`, `in_progress`, `completed`, `cancelled`, `canceled`, and `closed`;
- never exposes raw phone, address, LINE id, internal notes, raw payloads, or `finalAppointmentId`;
- never mutates input context or appointment objects.

## Boundaries

- Pure helper only.
- Unit/static tests only.
- No state mutation.
- No DB.
- No repository.
- No route/controller/API rollout.
- No auth/session/JWT runtime.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No migration.
- No smoke/shared runtime.
- No start travel action execution.
- No arrival action.
- No completion/report action.
- No Appointment/Case/FSR/Completion Report/customer identity/provider state/`finalAppointmentId` mutation.

## Test Coverage

Task930 unit coverage proves:

- missing context denies safely;
- missing organizationId denies safely;
- missing engineerId denies safely;
- missing appointment denies safely;
- organization mismatch denies safely;
- assigned engineer mismatch denies safely;
- missing permission denies safely;
- safe pre-departure statuses allow `canStartTravel`;
- travel-started/arrived/completed/cancelled/closed statuses deny `canStartTravel`;
- unsupported status denies without sensitive leakage;
- snake_case appointment fields work without raw field exposure;
- input context and appointment objects are not mutated.

Task930 static closure proves:

- helper imports no DB/repository/transaction/base repository;
- helper imports no route/controller/server/app/listen/bootstrap;
- helper imports no auth/session/JWT runtime;
- helper imports no provider/LINE/SMS/email/App/webhook;
- helper imports no AI/RAG/vector/search;
- helper imports no billing/settlement;
- helper imports no env/config/credential/logger/network dependencies;
- helper contains no insert/update/delete SQL or mutation method calls;
- helper does not call workflow action functions such as startTravel/recordArrival/complete/publishReport;
- helper does not expose or mutate `finalAppointmentId`.

## Verification

Commands to run:

```bash
node --test tests/engineerMobile/engineerPreDepartureActionEligibility.unit.test.js
node --test tests/engineerMobile/engineerPreDepartureActionEligibilityClosure.static.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/engineerMobile tests/engineerMobile docs/task-930-engineer-mobile-pre-departure-action-eligibility-evaluator-pure-helper-no-state-change.md
```

Current results:

- `node --test tests/engineerMobile/engineerPreDepartureActionEligibility.unit.test.js`: PASS, 13/13.
- `node --test tests/engineerMobile/engineerPreDepartureActionEligibilityClosure.static.test.js`: PASS, 5/5.
- `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js`: PASS, 12/12.
- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js`: PASS, 13/13.
- `node --test tests/engineerMobile/*.js`: PASS, 736/736.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 3105/3105.
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-930-engineer-mobile-pre-departure-action-eligibility-evaluator-pure-helper-no-state-change.md`: PASS.
