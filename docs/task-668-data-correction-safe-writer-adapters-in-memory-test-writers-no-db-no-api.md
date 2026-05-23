# Task 668 - Data Correction Safe Writer Adapters / In-memory Test Writers / No DB / No API

## Scope

Task668 adds Data Correction safe writer utilities that can be injected into later tests and bounded runtime slices without connecting real persistence.

This task creates in-memory writer adapters only. They are not a DB repository, not a provider, and not real audit/contact/dispatch/follow-up persistence.

## Runtime Decision

- `createDataCorrectionSafeWriterSet(options)` returns safe in-memory writer functions for:
  - `auditWriter`
  - `contactLogWriter`
  - `dispatchNoteWriter`
  - `engineerNotificationWriter`
  - `appointmentResultWriter`
  - `evidenceWriter`
  - `followUpDraftWriter`
  - `correctionWriter`
- `createInMemoryDataCorrectionWriterStore()` stores sanitized writes in memory only.
- `sanitizeDataCorrectionWriterPayload(payload)` applies an allow-list before any write is stored.
- Writer results expose only `{ ok, writerType, id }` or `{ ok: false, writerType, reasonCode }`.
- No writer logs, writes files, calls external services, imports DB modules, or mutates global state.

## Payload Allow-list / Sanitization

Allowed payload keys are limited to safe metadata:

- `organizationId`
- `caseId`
- `appointmentId`
- `actorUserId`
- `actorRole`
- `fieldKey`
- `fieldGroup`
- `decision`
- `reasonCode`
- `safeMessageKey`
- `actionType`
- `terminalState`
- `proposalType`
- `timestamp`
- `evidenceRefs`
- `requiredPartsRefs`

Nested safe values from `actor.userId`, `actor.role`, `correction.fieldKey`, and `correction.fieldGroup` may be normalized into the allow-listed keys.

The writers do not preserve raw or sensitive fields such as:

- `fromValue`
- `toValue`
- raw phone/address/LINE user id values
- token/secret/password/DB URL values
- internal note
- audit raw payload
- AI raw payload
- `finalAppointmentId`
- full request/body/header/cookie dumps

## Evidence / Parts Ref Rule

`evidenceRefs` and `requiredPartsRefs` must be safe reference strings only, such as `photo_ref_test_001` or `part_ref_test_001`.

Raw storage paths, URLs, signed URLs, or token-bearing references are rejected with `UNSAFE_PAYLOAD`.

## In-memory Store Behavior

- Store writes are per writer set unless a caller explicitly injects a store.
- No global singleton is used.
- `list()` returns a deep copy, so callers cannot mutate internal writes.
- The public `writes` getter also returns a copy.
- Only sanitized payloads are stored.

## Explicit Non-goals

- No API route change.
- No route/controller/app/server change.
- No DB connection.
- No repository, transaction, migration, or schema change.
- No real audit/contact/dispatch/follow-up persistence.
- No provider, LINE, SMS, Email, App push, notification, AI, RAG, vector, file storage, upload, or download runtime.
- No admin frontend change.
- No smoke, browser, fixture, package, guardrails, short-instruction, design-doc, task-index, or README change.

## Coverage Added

The unit coverage verifies:

- Exported writer factory functions and constants.
- Writer set returns all expected writers.
- Audit, contact log, dispatch note, correction, and appointment result writers store sanitized payloads.
- Evidence writer stores only safe evidence refs.
- Follow-up draft writer stores only safe required parts refs.
- Raw phone, raw address, raw LINE id, token, secret, DB URL, internal note, audit raw payload, AI raw payload, and `finalAppointmentId` are stripped from stored writes and writer results.
- Full request/body/header/cookie dumps are stripped.
- Raw storage paths and signed URLs are rejected for evidence refs.
- Unsafe required parts refs are rejected.
- Malformed payloads fail closed.
- Store `list()` and `writes` return copies.
- Writer stores are not global singletons.
- No logging side effects.
- Module source has no DB, repository, provider, AI, route, or controller imports.

## Future Tasks

- Inject these safe writers into later route/app/server tests when a bounded task needs writer behavior without persistence.
- Add real audit/contact/dispatch/follow-up persistence in separate bounded repository/service tasks.
- Add DB migration only after persistence models and audit requirements are approved.
- Preserve the allow-list and evidence ref safety rules when moving from in-memory writers to real persistence.

## Verification

Planned verification commands:

- `node --check src/dataCorrection/dataCorrectionSafeWriters.js`
- `node --test tests/dataCorrection/dataCorrectionSafeWriters.unit.test.js`
- `git diff --check -- src/dataCorrection/dataCorrectionSafeWriters.js tests/dataCorrection/dataCorrectionSafeWriters.unit.test.js docs/task-668-data-correction-safe-writer-adapters-in-memory-test-writers-no-db-no-api.md`
