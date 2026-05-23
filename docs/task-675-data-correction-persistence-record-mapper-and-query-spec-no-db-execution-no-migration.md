# Task 675 — Data Correction Persistence Record Mapper and Query Spec / No DB Execution / No Migration

## Scope

Task675 adds a pure Data Correction persistence record mapper and non-executable query spec builder.

This is a pre-DB slice. It converts sanitized writer payloads into safe record shapes and static parameterized insert specs for future repository work. It does not connect to a database, execute SQL, add a migration, change schema, or wire any route/app/server runtime.

## Files Changed

- Added `src/dataCorrection/dataCorrectionPersistenceRecordMapper.js`
- Added `tests/dataCorrection/dataCorrectionPersistenceRecordMapper.unit.test.js`
- Added `docs/task-675-data-correction-persistence-record-mapper-and-query-spec-no-db-execution-no-migration.md`

## Runtime Decision

The new mapper exports:

- `mapDataCorrectionWriterPayloadToRecord(input)`
- `buildDataCorrectionPersistenceQuerySpec(input)`
- `DATA_CORRECTION_PERSISTENCE_RECORD_TYPES`
- `DATA_CORRECTION_PERSISTENCE_FIELDS`

The mapper is pure and deterministic. It imports only `./dataCorrectionSafeWriters` for writer type constants and payload sanitization.

## Safe Record Behavior

Supported record types:

- `audit`
- `contact_log`
- `dispatch_note`
- `engineer_notification_intent`
- `appointment_result`
- `evidence`
- `follow_up_draft`
- `correction_application`

Every record requires `organizationId`. Records also require `caseId`, and appointment-related records require `appointmentId`.

Safe record output includes only allow-listed operational fields:

- organization, case, appointment, actor, action, decision, reason, safe message, timestamp, record type
- safe metadata such as field key/group, terminal state, proposal type, evidence refs, required parts refs

Raw values are not carried forward:

- raw phone, address, LINE user id, `line_user_id`
- token, secret, password, database URL values
- internal note, audit log dump, AI raw payload
- `finalAppointmentId`
- raw request/body/header/cookie containers
- raw `fromValue` / `toValue`

Unsafe evidence or required-parts refs fail-close through the shared sanitizer.

## Query Spec Behavior

`buildDataCorrectionPersistenceQuerySpec(input)` returns a non-executable static insert spec:

- `executable: false`
- conceptual `tableHint`
- ordered `fields`
- ordered `values`
- `params` containing record property names
- static parameterized SQL string with placeholders

The SQL string does not interpolate raw record values. The spec is only a future repository planning artifact and does not authorize DB execution, migration creation, or table creation.

Invalid or unsafe payloads fail-close and return `executable: false`.

## Tests

Added `tests/dataCorrection/dataCorrectionPersistenceRecordMapper.unit.test.js`.

Coverage verifies:

- exports and constants.
- valid audit, contact log, dispatch note, correction application, appointment result, evidence, follow-up draft, and engineer notification payloads map to safe records.
- missing `organizationId` fail-closes.
- unsupported writer type fail-closes without echoing raw type.
- raw phone/address/LINE id/token/secret/DB URL/finalAppointmentId are stripped.
- raw `fromValue` / `toValue` are not included in records.
- unsafe evidence refs and required-parts refs are rejected.
- query spec is non-executable and parameterized.
- query spec does not interpolate raw values into SQL.
- invalid query spec fail-closes.
- input object is not mutated.
- module import boundary avoids DB, repository, provider, AI, route, controller, app, and server imports.

## Non-goals

- No DB connection.
- No SQL execution.
- No migration.
- No schema change.
- No repository or query executor.
- No route, controller, app, or server change.
- No real audit/contact/dispatch/appointment/follow-up persistence.
- No provider, notification, LINE, SMS, App push, Email, AI, RAG, vector, browser, or smoke runtime.
- No admin frontend change.
- No guardrail, short instruction, design index, archive, or README change.

## Future Tasks

- Add repository-backed low-level persistence writers only in a separately scoped DB/repository task.
- Decide concrete tables and migrations before making any query spec executable.
- Add transaction behavior after DB schema and repository scope are approved.
- Add integration/smoke coverage only after real persistence and permission/audit boundaries are approved.

## Verification

Executed verification commands:

- `node --check src/dataCorrection/dataCorrectionPersistenceRecordMapper.js`: PASS
- `node --test tests/dataCorrection/dataCorrectionPersistenceRecordMapper.unit.test.js`: PASS (19 passed / 0 failed)
- `git diff --check -- src/dataCorrection/dataCorrectionPersistenceRecordMapper.js tests/dataCorrection/dataCorrectionPersistenceRecordMapper.unit.test.js docs/task-675-data-correction-persistence-record-mapper-and-query-spec-no-db-execution-no-migration.md`: PASS
