# Task 884 - Data Correction Decision Audit Repository Writer Implementation Preflight

Status: completed

## Goal

Create the final implementation preflight before any repository / writer runtime for `data_correction_decision_audit_events`.

Task884 is docs + static test only. It does not implement `src` runtime, repository, writer, DB connection, transaction wiring, route/API change, audit sink, migration execution, dry-run, apply, provider traffic, AI/RAG, billing/settlement, permission runtime expansion, or correction behavior changes.

## Evidence Chain

Task884 relies on the accepted Task869 through Task883 chain:

- Task869: pure Data Correction decision `auditIntent` builder.
- Task870: internal opt-in side-channel for request/apply service callers.
- Task871: side-channel closure guard.
- Task872: persistence readiness packet.
- Task873: schema proposal.
- Task874: migration authorization packet.
- Task875: migration draft plan.
- Task876: migration file creation preflight gate.
- Task877: `migrations/025_create_data_correction_decision_audit_events.sql` no-apply file.
- Task878: disposable DB dry-run authorization packet.
- Task879: redacted dry-run result template.
- Task880: no-DB branch closure checkpoint.
- Task881: PM continuation handoff.
- Task882: handoff static guard.
- Task883: branch status dashboard.

Migration 025 exists, but remains:

- no DB
- no `psql`
- no `npm run db:migrate`
- no DDL execution
- no SQL execution
- no dry-run
- no apply
- no migration execution authorization

## Next Possible Implementation Scope

The next possible implementation task, if explicitly authorized later, should be limited to:

- repository / writer with injected `dbClient` or injected transaction only.
- fake DB unit tests only.
- no real DB connection.
- no global DB import.
- no `process.env` read.
- no config / credential read.
- no route/controller/API body change.
- no public service response shape change.
- no correction application behavior change.
- no migration execution.
- no smoke / integration test unless separately authorized after DB approval.

Future candidate source file names may include, but must not be created by Task884:

- `src/dataCorrection/dataCorrectionDecisionAuditEventRepository.js`
- `src/dataCorrection/dataCorrectionDecisionAuditEventWriter.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditEventRepository.unit.test.js`
- `tests/dataCorrection/dataCorrectionDecisionAuditEventWriter.unit.test.js`

Those names are planning candidates only. Task884 creates none of them.

## Safe Insert Payload Columns

Any future writer must insert only the safe metadata columns defined by Migration 025:

- `organization_id`
- `case_id`
- `appointment_id`
- `actor_id`
- `actor_role`
- `action`
- `field_key`
- `field_group`
- `event_type`
- `decision`
- `reason_code`
- `safe_message_key`
- `result_status`
- `request_id`
- `created_at`
- `retention_until`
- `deleted_at`

The future writer must not insert or derive:

- before / after values
- raw correction payload
- raw phone / mobile
- raw address
- raw LINE user id
- token
- secret
- credentials
- DB URL
- stack traces
- SQL input with secrets
- `finalAppointmentId`
- Field Service Report id / report id
- internal note
- audit raw payload
- AI raw payload
- billing / settlement internals
- full payload
- provider payload
- customer-visible report body
- photos
- signatures
- files
- file contents

## Future Writer Contract

If later authorized, the future writer should:

- accept a sanitized `auditIntent` only.
- require `organization_id`.
- require safe `event_type`.
- require safe `result_status`.
- accept optional safe case / appointment / actor metadata.
- use parameterized SQL only.
- return a safe success / safe failure envelope.
- expose no raw DB error, stack, SQL text, credential, token, phone, address, LINE id, payload, or raw values.
- avoid mutating input.
- avoid logging payloads.
- keep `auditWritten=false` behavior unchanged until the service integration task explicitly changes it.

## Fail-closed Cases

Future fake DB unit tests should cover at least:

- missing injected `dbClient` or transaction.
- missing `organization_id`.
- unsafe `event_type`.
- unsafe `result_status`.
- unsafe extras.
- malformed `auditIntent`.
- DB throw.
- timeout-like failure.
- duplicate `request_id`.
- transaction failure.
- malformed DB result.
- input mutation attempt.
- raw sensitive values in input.

All failures should return a safe non-sensitive failure envelope and should not throw raw errors to callers.

## Future Writer Must Not Change

Any future repository / writer task must not:

- alter public service response shape.
- create or modify official correction applications.
- mutate Case.
- mutate Appointment.
- mutate Field Service Report.
- mutate `finalAppointmentId`.
- mutate customer identity.
- send provider traffic.
- send LINE / SMS / App push / webhook / email.
- call AI / RAG.
- affect billing / settlement.
- expose route/controller/API body fields.
- expand permission runtime.

## Future Task Stop Conditions

A future implementation task must stop before editing if it cannot keep all of the following true:

- injected DB only.
- fake DB unit tests only.
- no real DB.
- no `psql`.
- no migration execution.
- no global DB import.
- no environment / config / credential reads.
- no route/controller/API changes.
- no public response shape change.
- no provider sending.
- no AI/RAG.
- no billing/settlement.
- no smoke/integration test.
- no secrets or sensitive payloads in output.

## Scope Confirmation

Task884 is docs + static test only:

- no `src/**` change
- no `admin/src/**` change
- no migration creation, modification, dry-run, or apply
- no DB / `psql` / DDL / SQL execution
- no repository
- no audit writer / sink
- no API / route / controller / DTO change
- no permission runtime expansion
- no provider / LINE / SMS / App push / webhook / email change
- no AI / RAG runtime change
- no billing / settlement change
- no package change
- no smoke / integration test change
- no sensitive data, token, secret, LINE access token, channel secret, DB credential, or AI provider config touched

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterImplementationPreflight.static.test.js
test -f docs/task-884-data-correction-decision-audit-repository-writer-implementation-preflight-no-runtime-no-db.md
git diff --check -- docs/task-884-data-correction-decision-audit-repository-writer-implementation-preflight-no-runtime-no-db.md tests/dataCorrection/dataCorrectionDecisionAuditWriterImplementationPreflight.static.test.js
```

Results:

- `node --test tests/dataCorrection/dataCorrectionDecisionAuditWriterImplementationPreflight.static.test.js`: PASS, 10 passed / 0 failed.
- `test -f docs/task-884-data-correction-decision-audit-repository-writer-implementation-preflight-no-runtime-no-db.md`: PASS.
- `git diff --check -- docs/task-884-data-correction-decision-audit-repository-writer-implementation-preflight-no-runtime-no-db.md tests/dataCorrection/dataCorrectionDecisionAuditWriterImplementationPreflight.static.test.js`: PASS.
