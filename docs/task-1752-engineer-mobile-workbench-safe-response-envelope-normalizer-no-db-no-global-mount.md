# Task1752 Engineer Mobile Workbench Safe Response Envelope Normalizer

Status: local runtime patch, pending PM review.

## Scope

Task1752 adds a pure safe response envelope normalizer for the Engineer Mobile Workbench read-only runtime path.

This is bounded runtime code only. It does not add production route mounting, DB-backed reads, workflow mutations, provider sending, admin UI, package changes, smoke coverage, or API shape changes.

## Files Changed

- `src/engineerMobile/engineerMobileWorkbenchSafeEnvelope.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentsHandler.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js`
- `tests/engineerMobile/engineerMobileWorkbenchSafeEnvelope.unit.test.js`

## Runtime Surface Added

`engineerMobileWorkbenchSafeEnvelope.js` exports pure helpers:

- `createEngineerMobileWorkbenchSuccessEnvelope`
- `createEngineerMobileWorkbenchDenyEnvelope`
- `createEngineerMobileWorkbenchErrorEnvelope`
- `sanitizeWorkbenchMetadata`
- `sanitizeWorkbenchPayload`

The helpers:

- preserve accepted public response shapes when no metadata or reason is supplied
- produce safe success, deny, and error envelopes
- allow safe metadata such as request id, trace id, organization id, engineer user id, appointment id, and safe reason/status codes
- strip unsafe payload, metadata, and error fields by allowlist/exclusion
- avoid mutating input objects
- do not import DB, app, server, routes, provider, auth/session runtime, or workflow mutation code

## Integration

The normalizer is integrated into the accepted read-only handlers:

- assigned appointment list handler
- assigned appointment detail handler

The integration keeps the existing accepted public shapes:

- list success remains `status/messageKey/engineerMobileVisible/data.appointments`
- list deny remains `status/messageKey/engineerMobileVisible/data.appointments/error.messageKey`
- detail success remains `status/messageKey/engineerMobileVisible/data.appointment`
- detail deny remains `status/messageKey/engineerMobileVisible/data.appointment/error.messageKey`

HTTP adapter, request context resolver, and repository guard were left unchanged in this task to avoid broad rewrite. The new helper is generic enough for those surfaces to adopt in a later bounded task.

## Tests Added / Updated

Added `tests/engineerMobile/engineerMobileWorkbenchSafeEnvelope.unit.test.js` covering:

- success envelope safe data and safe metadata only
- deny envelope preserving the existing public shape
- deny envelope safe reason only
- error envelope no raw error or stack leak
- unsafe metadata stripping
- no input mutation
- no DB/app/server/routes/listen/provider/mutation dependency in source

Existing list/detail handler tests were reused to prove the public response shapes remain accepted and fail-closed behavior is unchanged.

## Verification

Executed:

```bash
node --test tests/engineerMobile/engineerMobileWorkbenchSafeEnvelope.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js
```

Result: PASS, 31 tests.

## Explicit Non-goals

- No DB.
- No migration.
- No psql or db:migrate.
- No smoke.
- No global route mount.
- No provider sending.
- No LINE, SMS, email, or webhook.
- No AI or RAG.
- No billing or settlement.
- No admin UI.
- No package changes.
- No `src/app.js`, `src/server.js`, or `src/routes/**`.
- No workflow mutation.
- No completion write.
- No Field Service Report creation or update.
- No `finalAppointmentId` exposure, inference, or mutation.
- No commit.
- No push.

## Boundary Confirmation

Task1752 preserves the Engineer Mobile read-only boundary. It does not alter Case, Appointment, Dispatch, Completion Report, or Field Service Report state. It does not affect the invariant that one Case can have multiple appointments or dispatch visits but only one formal Field Service Report.
