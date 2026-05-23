# Task 925 - Engineer Mobile Assigned Appointment Detail Projection / Injected DB Client / No Route No Workflow

Status: completed

## Goal

Add a read-only Engineer Mobile assigned appointment detail projection service that complements the Task921 assigned appointments list projection.

This remains synthetic and read-only:

```text
injected dbClient + pre-resolved engineerContext + appointmentId -> mobile-safe detail projection
```

No route/controller/API rollout, production app/server/bootstrap/listen edit, real DB connection, repository, transaction, auth/session/JWT runtime, migration, provider sending, AI/RAG, billing/settlement, smoke/shared runtime, workflow action, staging, or commit is added.

## Modified Files

- `src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailProjectionServiceClosure.static.test.js`
- `docs/task-925-engineer-mobile-assigned-appointment-detail-projection-injected-db-client-no-route-no-workflow.md`

No `admin/src/`, `README.md`, `migrations/`, route/controller/bootstrap/server/listen files, auth/session/JWT runtime files, real DB/repository/transaction files, provider files, AI/RAG/vector/search files, billing/settlement files, package/env/config/credential files, smoke/shared runtime infrastructure, Customer Access Task908-Task920 files, staging, or commit was modified for Task925.

## Implementation Summary

Added `getEngineerAssignedAppointmentDetailProjection({ dbClient, engineerContext, appointmentId })` as a pure read-only projection service.

The service:

- requires an injected synthetic `dbClient.query`;
- requires a pre-resolved authorized `engineerContext`;
- requires `organizationId`;
- requires `engineerId`;
- requires a safe appointment identifier;
- builds a read-only query spec with `readOnly: true`;
- scopes query parameters by organization, assigned engineer, and appointment id;
- re-checks returned rows for organization, assigned engineer, and appointment id;
- returns a generic safe-deny envelope for not found, unauthorized, org mismatch, engineer mismatch, query error, or invalid appointment id;
- returns only an allowlisted mobile-safe detail projection;
- does not mutate Case, Appointment, Field Service Report, Completion Report, customer identity, provider state, or `finalAppointmentId`.

## Detail Projection Allowlist

The mobile-safe detail projection may include:

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
- `canOpenDetails`
- `canStartTravel`
- `canRecordArrival`
- `canPrepareCompletionDraft`

The `canStartTravel`, `canRecordArrival`, and `canPrepareCompletionDraft` fields are computed display hints only. They do not perform workflow actions.

## Sensitive Field Exclusion

The projection excludes top-level and nested sensitive/internal fields by construction, including:

- raw phone / mobile / tel;
- raw full address;
- `line_user_id` / `lineUserId`;
- provider raw payload;
- auth token/header/cookie;
- customer identity binding internals;
- internal notes;
- dispatcher notes;
- technician private notes;
- billing / settlement internals;
- AI raw payload;
- raw DB rows;
- SQL;
- stack traces;
- DB URL / connection string;
- token / secret / password / API key;
- `finalAppointmentId`;
- Field Service Report / Completion Report raw ids;
- full Case payload;
- full Appointment payload;
- full Report payload;
- private attachments;
- unpublished customer report data.

## Preserved Boundaries

- No Route.
- No Workflow.
- No route/controller/API rollout.
- No production app/server/bootstrap/listen edit.
- No real DB connection.
- No repository.
- No transaction.
- No auth/session/JWT runtime.
- No migration.
- No psql.
- No `npm run db:migrate`.
- No DDL/SQL dry-run/apply.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No smoke/shared runtime.
- No check-in/start travel/arrival/completion/report creation/report publish.
- No Case/Appointment/Field Service Report/Completion Report/customer identity/provider state/`finalAppointmentId` mutation.
- No `finalAppointmentId` exposure.

## Coverage

The unit and static tests verify:

- missing `dbClient` fails closed;
- missing `engineerContext` fails closed;
- missing `organizationId` fails closed;
- missing `engineerId` fails closed;
- missing/invalid appointment id fails closed;
- unauthorized engineer context fails closed;
- organization mismatch fails closed without existence leakage;
- non-assigned engineer row fails closed without existence leakage;
- wrong appointment row fails closed without existence leakage;
- query error returns generic safe-deny/unavailable without raw error leakage;
- valid authorized row returns only allowlisted mobile-safe detail projection;
- projection excludes all forbidden sensitive/internal fields, including nested fields;
- synthetic DB client proves no insert/update/delete/mutation method is called;
- source imports no real DB/repository/transaction/base repository, route/controller/server/app/listen/bootstrap, auth/session/JWT, provider/LINE/SMS/email/App/webhook, AI/RAG/vector/search, billing/settlement, env/config/credential/logger/network, smoke, migration, or admin dependency;
- source contains no insert/update/delete/DDL or official workflow mutation path.

## Verification

Commands to run:

```bash
node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionServiceClosure.static.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/engineerMobile tests/engineerMobile docs/task-925-engineer-mobile-assigned-appointment-detail-projection-injected-db-client-no-route-no-workflow.md
```

Current results:

- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js`: PASS, 13/13.
- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionServiceClosure.static.test.js`: PASS, 7/7.
- `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js`: PASS, 12/12.
- `node --test tests/engineerMobile/*.js`: PASS, 680/680.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 3049/3049.
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-925-engineer-mobile-assigned-appointment-detail-projection-injected-db-client-no-route-no-workflow.md`: PASS.
