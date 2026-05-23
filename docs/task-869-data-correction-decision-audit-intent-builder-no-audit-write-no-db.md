# Task 869 - Data Correction Decision Audit Intent Builder

Status: completed

## Goal

Add a pure Data Correction decision audit-intent builder after the Task868 request/apply branch closure. The builder prepares safe metadata for future audit evidence without writing audit logs, changing API response shape, creating official correction applications, or touching database/runtime persistence.

## Scope

Changed files:

- `src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.unit.test.js`
- `docs/task-869-data-correction-decision-audit-intent-builder-no-audit-write-no-db.md`

## Implemented Boundary

The builder is a pure deterministic module. It consumes service/result metadata and returns safe audit intent data with:

- `auditWritten: false`
- event type
- organization id
- actor id / role, when safe
- case id, when safe
- appointment id, when safe
- action
- field key / field group
- decision
- reason code
- result status
- safe message key
- injected timestamp, when provided

It supports these bounded decision outcomes:

- request accepted
- request manual-handling
- request denied
- request validation failed
- request writer failed
- apply allowed
- apply denied
- apply validation failed
- apply writer failed
- malformed / unavailable input

## Safe Event Types

- `data_correction_request_accepted`
- `data_correction_request_manual_handling`
- `data_correction_request_denied`
- `data_correction_request_validation_failed`
- `data_correction_request_writer_failed`
- `data_correction_apply_allowed`
- `data_correction_apply_denied`
- `data_correction_apply_validation_failed`
- `data_correction_apply_writer_failed`
- `data_correction_decision_malformed`

## Redaction / Exclusion Boundary

The builder does not include:

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

Malformed input returns a safe minimal malformed intent without throwing.

## Non-goals

This task does not:

- write audit logs.
- add audit writer / sink runtime.
- add DB persistence, repository, migration, DDL, psql, dry-run, or apply.
- change API routes, controllers, DTOs, response shape, app/server wiring, or public body fields.
- create official correction applications.
- mutate Case, Appointment, Field Service Report, customer identity, phone, channel identity, parts, billing, settlement, or `finalAppointmentId`.
- call provider, LINE, SMS, App push, webhook, AI, RAG, billing, or settlement runtime.
- add admin UI, package changes, smoke tests, provider config, token, or secret changes.

## Future Task Boundary

Future audit persistence still requires separate bounded approval for:

- audit writer / sink design.
- DB schema or migration.
- injected repository / transaction boundary.
- route/controller/app wiring.
- permission / organization scope hardening.
- retention and redaction policy.
- integration or smoke coverage.

This task is only an intent builder and does not authorize those follow-up tasks by itself.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.unit.test.js
node --test tests/dataCorrection/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.js tests/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.unit.test.js docs/task-869-data-correction-decision-audit-intent-builder-no-audit-write-no-db.md
```
