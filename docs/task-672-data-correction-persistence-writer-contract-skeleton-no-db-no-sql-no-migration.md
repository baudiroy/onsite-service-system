# Task 672 — Data Correction Persistence Writer Contract Skeleton / No DB / No SQL / No Migration

## Scope

Task672 adds a persistence writer contract skeleton for the Data Correction / Amendment Governance first-phase runtime chain.

The new contract adapts high-level data correction writer calls to injected low-level persistence writer functions. It intentionally does not connect any database, SQL, repository, migration, provider, notification, LINE, SMS, AI, RAG, route, app, or server runtime.

## Runtime Decision

- Added `src/dataCorrection/dataCorrectionPersistenceWriters.js`.
- Exported `DATA_CORRECTION_PERSISTENCE_WRITER_TYPES`.
- Exported `createDataCorrectionPersistenceWriterContract(options)`.
- Exported `createDataCorrectionPersistenceWriterSet(options)`.
- The writer set exposes:
  - `auditWriter`
  - `contactLogWriter`
  - `dispatchNoteWriter`
  - `engineerNotificationWriter`
  - `appointmentResultWriter`
  - `evidenceWriter`
  - `followUpDraftWriter`
  - `correctionWriter`
- Each high-level writer requires an injected low-level writer.
- Missing writer configuration fail-closes with `WRITER_NOT_CONFIGURED`.
- Unsupported writer type fail-closes with `WRITER_TYPE_NOT_SUPPORTED`.
- Low-level writer exceptions fail-close with `WRITER_FAILED`.
- The raw exception message is not returned or logged by the contract.
- Payload is sanitized through the existing safe writer allow-list before the low-level writer is called.

## Injected Writer Options

`createDataCorrectionPersistenceWriterSet(options)` accepts:

- `auditPersistenceWriter`
- `contactLogPersistenceWriter`
- `dispatchNotePersistenceWriter`
- `engineerNotificationIntentPersistenceWriter`
- `appointmentResultPersistenceWriter`
- `evidencePersistenceWriter`
- `followUpDraftPersistenceWriter`
- `correctionApplicationPersistenceWriter`

Each low-level writer can be a function or an object with a `write(payload)` method.

## Safe Payload Boundary

The low-level writer only receives the sanitized allow-listed payload.

Forbidden raw data remains stripped or rejected before persistence:

- raw phone, address, LINE user id, `line_user_id`
- token, secret, password, database URL values
- internal note, audit log dump, AI raw payload
- `finalAppointmentId`
- raw request/body/header/cookie containers
- raw `fromValue` / `toValue`
- unsafe evidence or required-parts references

Evidence and required-parts references must be safe reference strings. Signed URLs, raw paths, traversal strings, and token-bearing references are rejected before the low-level writer is called.

## Non-goals

- No DB migration.
- No DB schema change.
- No SQL query.
- No repository integration.
- No route, controller, app, or server change.
- No real audit/contact/dispatch/appointment/follow-up persistence.
- No notification, provider, LINE, SMS, App push, Email, AI, RAG, vector, or webhook runtime.
- No smoke, browser, fixture, or provider test.
- No admin frontend change.
- No guardrail, short instruction, design index, archive, or README change.

## Tests

Added `tests/dataCorrection/dataCorrectionPersistenceWriters.unit.test.js`.

Coverage verifies:

- exports and writer type constants.
- writer set shape.
- missing writer fail-closed behavior.
- injected low-level writer calls for all high-level writer types.
- function writer and object `write(payload)` writer support.
- low-level exceptions return safe failure without leaking raw error details.
- unsafe scalar fields and request-like containers are stripped before low-level writer invocation.
- unsafe evidence and required-parts refs are rejected and not persisted.
- input payload is not mutated.
- writer failures do not log sensitive payload or error details.
- source boundary imports only `./dataCorrectionSafeWriters` and contains no DB, SQL, repository, provider, AI, route, app, or server dependency.

## Future Tasks

- Add repository-backed low-level persistence writers in a separately scoped task.
- Decide whether the persistence writers should return persisted ids once real tables exist.
- Add transaction strategy only when the concrete persistence layer is approved.
- Add route/app/server composition only after persistence writer contracts and permission/audit boundaries are fully reviewed.
- Add integration or smoke coverage only after real persistence exists.

## Verification

Executed verification commands:

- `node --check src/dataCorrection/dataCorrectionPersistenceWriters.js`: PASS
- `node --test tests/dataCorrection/dataCorrectionPersistenceWriters.unit.test.js`: PASS, 21 passed / 0 failed
- `git diff --check -- src/dataCorrection/dataCorrectionPersistenceWriters.js tests/dataCorrection/dataCorrectionPersistenceWriters.unit.test.js docs/task-672-data-correction-persistence-writer-contract-skeleton-no-db-no-sql-no-migration.md`: PASS
