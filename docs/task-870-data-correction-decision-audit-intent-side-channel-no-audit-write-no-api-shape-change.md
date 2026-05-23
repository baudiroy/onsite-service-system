# Task 870 - Data Correction Decision Audit Intent Side-channel

Status: completed

## Goal

Compose the Task869 pure audit-intent builder into the existing Data Correction request/apply services as an opt-in internal side-channel. The side-channel prepares safe metadata for future audit wiring without changing the default public response shape, writing audit logs, persisting data, or expanding request/apply behavior.

## Scope

Changed files:

- `src/dataCorrection/dataCorrectionRequestService.js`
- `src/dataCorrection/preDepartureCorrectionApplicationService.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannel.unit.test.js`
- `tests/dataCorrection/dataCorrectionRequestService.unit.test.js`
- `docs/task-870-data-correction-decision-audit-intent-side-channel-no-audit-write-no-api-shape-change.md`

## Implemented Boundary

The request and pre-departure apply services now support an internal opt-in option:

- `includeDecisionAuditIntent`
- `includeAuditIntent`

When neither option is provided, the service response shape remains unchanged.

When one of the options is provided, the service returns:

- `response`: the original safe service response
- `auditIntent`: Task869 safe metadata with `auditWritten: false`

The side-channel covers:

- request accepted
- request manual-handling
- request denied
- request validation failed
- request writer failed
- apply allowed
- apply denied
- apply validation failed
- apply writer failed

## No Public API Shape Change

This task does not modify routes, controllers, DTOs, app/server wiring, public response envelopes, API status codes, or request payload contracts. Existing callers that do not pass the internal opt-in option continue to receive the same service response shape.

## No New Side Effects

This task does not:

- write audit logs.
- add an audit writer / sink.
- add DB persistence, repository wiring, migration, DDL, psql, dry-run, or apply.
- create new official correction applications.
- change data mutation behavior.
- change permission behavior.
- call provider, LINE, SMS, App push, webhook, AI, RAG, billing, or settlement runtime.
- touch admin UI, package files, environment files, provider config, tokens, or secrets.

The services already had their bounded writer behavior from earlier Data Correction tasks. Task870 only adds opt-in audit-intent composition and tests that the side-channel itself does not add new persistence or external dependencies.

## Redaction / Exclusion Boundary

The side-channel audit intent does not include:

- before / after values
- raw correction payload
- raw phone / mobile / address
- raw LINE user id
- token / secret / credentials
- DB URL
- stack traces
- SQL
- `finalAppointmentId`
- Field Service Report id / report id
- internal note
- audit raw payload
- AI raw payload
- billing / settlement internals
- full payload

## Compatibility

Task845-869 behavior remains unchanged:

- `data_correction_request` remains request/manual-handling only.
- official correction application remains limited to valid `pre_departure_apply`.
- phone re-verification, post-departure, arrived, malformed, permission-denied, and writer-failure paths do not create official correction applications.
- default request/apply output does not include `auditIntent`.

## Future Task Boundary

Future audit persistence still requires separate bounded approval for:

- audit writer / sink implementation.
- DB schema or migration.
- repository / transaction wiring.
- route/controller/app exposure.
- audit viewer or reporting UI.
- integration or smoke coverage.

This task is only an internal side-channel and does not authorize those follow-up tasks by itself.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannel.unit.test.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js # PASS, 38 passed / 0 failed
node --test tests/dataCorrection/*.js # PASS, 676 passed / 0 failed
npm run check # PASS
find tests -type f -name '*.js' -exec node --test {} + # PASS, 2556 passed / 0 failed
git diff --check -- src/dataCorrection/dataCorrectionRequestService.js src/dataCorrection/preDepartureCorrectionApplicationService.js src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.js tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannel.unit.test.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js docs/task-870-data-correction-decision-audit-intent-side-channel-no-audit-write-no-api-shape-change.md # PASS
git diff --check -- tests/dataCorrection/dataCorrectionSourceBoundary.static.test.js tests/dataCorrection/preDepartureCorrectionApplicationService.unit.test.js # PASS
```
