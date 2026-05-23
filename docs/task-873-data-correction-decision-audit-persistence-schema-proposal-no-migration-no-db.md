# Task 873 - Data Correction Decision Audit Persistence Schema Proposal

Status: completed

## Goal

Define a future schema proposal for persisting Data Correction decision `auditIntent` metadata without creating a migration, connecting to a DB, adding a repository, adding a writer, or changing runtime behavior.

This proposal is planning only. It does not authorize persistence.

## No Migration / No DB Boundary

Task873 does not:

- create a migration file.
- modify DB schema.
- run DDL.
- run `psql`.
- run `npm run db:migrate`.
- perform DB dry-run or apply.
- add repository code.
- add audit writer / sink code.
- add transaction code.
- wire route/controller/app/server runtime.
- change public API response shape.
- expand correction application behavior.
- add smoke/integration test.

Any future DB, migration, repository, writer, transaction, or runtime task requires separate explicit approval.

## Future Table / Concept Name

Future concept name:

- `data_correction_decision_audit_events`

This name is a proposal only. It is not a migration, table creation, or schema change.

## Proposed Safe Columns

Future schema proposals may consider only safe metadata fields:

- `id`
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

These columns are intended for evidence and audit traceability only. They must not store raw correction values, sensitive payloads, or customer-visible report contents.

## Proposed Index Direction

Future index planning may consider:

- `organization_id`, `created_at`
- `organization_id`, `case_id`, `created_at`
- `organization_id`, `actor_id`, `created_at`
- `organization_id`, `event_type`, `created_at`
- `organization_id`, `request_id`
- `retention_until`, `deleted_at`

Index design must remain organization-scoped and tenant-isolated. Cross-organization audit lookup must not be supported.

## Retention / Redaction Direction

Future persistence must define:

- retention period
- `retention_until` calculation
- soft-delete or archival policy
- hard-delete policy, if required
- masking rules for viewer/export/reporting
- field allow-list
- export restrictions
- access review expectations

Data Correction audit persistence should store minimal evidence metadata only. It should support auditability without retaining sensitive operational data unnecessarily.

## Forbidden Stored Data

Future persistence must not store:

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
- SQL
- `finalAppointmentId`
- Field Service Report id / report id
- internal note
- audit raw payload
- AI raw payload
- billing / settlement internals
- full payload
- cross-organization data
- provider payload
- customer-visible report body
- photos
- signatures
- files
- file contents

## Non-effect Boundary

Future persistence must not create, modify, delete, infer, send, or approve:

- official correction application
- Case
- Appointment
- Field Service Report
- `finalAppointmentId`
- customer identity
- phone binding
- LINE / App binding
- provider sending
- AI / RAG result
- billing result
- settlement result
- customer-facing report

Audit events are evidence. They are not source-of-truth business records and must not drive official correction behavior by themselves.

## Organization / Permission Boundary

Any future Data Correction audit persistence and read path must be:

- organization-scoped
- tenant-isolated
- permission-aware
- field-minimized
- redacted
- auditable
- safe for multi-tenant SaaS operation

Audit event reads, reports, exports, and admin viewers must not expose raw sensitive values or cross-organization records.

## Future Bounded Task Candidates

Recommended follow-up sequence:

1. Migration authorization packet / no DB
2. Migration file / no apply
3. Repository with injected fake DB tests / no global DB
4. Audit writer with fake DB unit tests / no route exposure
5. Service-level injected writer path / no public API change
6. Local-only dry-run / explicit disposable DB approval only
7. Runtime smoke after DB and writer approval only
8. Audit viewer/reporting after permission, retention, redaction, and export controls are defined

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionDecisionAuditPersistenceSchemaProposal.static.test.js # PASS, 10 passed / 0 failed
test -f docs/task-873-data-correction-decision-audit-persistence-schema-proposal-no-migration-no-db.md # PASS
grep -Ei "Data Correction|auditIntent|organizationId|caseId|appointmentId|actorId|fieldKey|fieldGroup|reasonCode|safeMessageKey|retention|redaction|no migration|no DB" docs/task-873-data-correction-decision-audit-persistence-schema-proposal-no-migration-no-db.md # PASS
git diff --check -- docs/task-873-data-correction-decision-audit-persistence-schema-proposal-no-migration-no-db.md tests/dataCorrection/dataCorrectionDecisionAuditPersistenceSchemaProposal.static.test.js # PASS
```

## Scope Confirmation

Task873 is docs + static test only:

- no `src/**` change
- no `admin/src/**` change
- no migration
- no DB / psql / DDL / dry-run / apply
- no repository
- no audit writer / sink
- no API / route / controller / DTO change
- no permission runtime change
- no provider / LINE / SMS / App push / webhook change
- no AI / RAG runtime change
- no billing / settlement change
- no package change
- no smoke / integration test change
- no sensitive data, token, secret, LINE access token, channel secret, or AI provider config touched
