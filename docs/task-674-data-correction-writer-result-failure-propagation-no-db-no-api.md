# Task 674 — Data Correction Writer Result Failure Propagation / No DB / No API

## Scope

Task674 updates Data Correction downstream services so injected writers that return explicit failure objects are treated as writer failures instead of recorded success.

This closes the Task673 compatibility note before real persistence is introduced.

## Files Changed

- `src/dataCorrection/dataCorrectionRequestService.js`
- `src/dataCorrection/preDepartureCorrectionApplicationService.js`
- `src/dataCorrection/postDepartureCorrectionFreezeService.js`
- `src/dataCorrection/unableToCompleteAppointmentResultService.js`
- `src/dataCorrection/followUpAppointmentProposalService.js`
- Added `tests/dataCorrection/dataCorrectionWriterResultFailurePropagation.unit.test.js`
- Added `docs/task-674-data-correction-writer-result-failure-propagation-no-db-no-api.md`

## Runtime Decision

The five Data Correction service writer adapters now treat the following returned writer objects as failure:

- `{ ok: false }`
- `{ persisted: false }`
- `{ recorded: false }`

Returned failures become safe failure metadata:

- `status: failed`
- `reasonCode: WRITER_FAILED`
- service-specific safe message key

Writer throw handling is preserved and remains safe. Undefined or null writer returns remain compatible with existing no-explicit-return writers.

## Behavior Preserved

- Phone correction still cannot be applied through normal correction flow.
- Post-departure freeze still routes to contact log / dispatch note / audit writer handling, not `correctionWriter`.
- Unable-to-complete still does not create a Field Service Report or follow-up appointment.
- Follow-up proposal still does not create a formal appointment.
- AI does not auto-modify or approve official data.
- No `finalAppointmentId` mutation or manual override was added.

## Tests

Added `tests/dataCorrection/dataCorrectionWriterResultFailurePropagation.unit.test.js`.

Coverage verifies:

- request service treats audit writer `{ ok:false }` as failure.
- request service treats audit writer `{ persisted:false }` as failure.
- pre-departure service treats correction writer `{ ok:false }` as failure.
- pre-departure service records engineer notification `{ recorded:false }` as writer failure.
- post-departure freeze treats contact log, dispatch note, and audit writer returned failures as failure.
- unable-to-complete treats appointment result and evidence writer returned failures as failure.
- follow-up proposal treats follow-up draft, dispatch note, and audit writer returned failures as failure.
- writer throw behavior remains safe.
- `{ ok:true }` and undefined writer returns remain compatible.
- input object is not mutated.
- outputs do not leak raw phone, address, LINE id, token, secret, DB URL, internal note, AI raw payload, or `finalAppointmentId`.
- service import boundaries avoid DB, repository, provider, AI, route, app, and server imports.

## Non-goals

- No API change.
- No route, controller, app, or server change.
- No DB connection.
- No SQL.
- No migration.
- No repository integration.
- No real audit/contact/dispatch/appointment/follow-up persistence.
- No provider, notification, LINE, SMS, App push, Email, AI, RAG, vector, browser, or smoke runtime.
- No admin frontend change.
- No guardrail, short instruction, design index, archive, or README change.

## Future Tasks

- Connect real low-level persistence writers in a separately scoped repository task.
- Add repository-backed transaction handling after DB schema and migration scope are approved.
- Add route/app/server integration tests after real persistence exists.
- Add smoke coverage only after real DB persistence and permission/audit boundaries are approved.

## Verification

Executed verification commands:

- `node --check src/dataCorrection/dataCorrectionRequestService.js`: PASS
- `node --check src/dataCorrection/preDepartureCorrectionApplicationService.js`: PASS
- `node --check src/dataCorrection/postDepartureCorrectionFreezeService.js`: PASS
- `node --check src/dataCorrection/unableToCompleteAppointmentResultService.js`: PASS
- `node --check src/dataCorrection/followUpAppointmentProposalService.js`: PASS
- `node --test tests/dataCorrection/dataCorrectionWriterResultFailurePropagation.unit.test.js`: PASS, 16 passed / 0 failed
- `git diff --check -- src/dataCorrection/dataCorrectionRequestService.js src/dataCorrection/preDepartureCorrectionApplicationService.js src/dataCorrection/postDepartureCorrectionFreezeService.js src/dataCorrection/unableToCompleteAppointmentResultService.js src/dataCorrection/followUpAppointmentProposalService.js tests/dataCorrection/dataCorrectionWriterResultFailurePropagation.unit.test.js docs/task-674-data-correction-writer-result-failure-propagation-no-db-no-api.md`: PASS
