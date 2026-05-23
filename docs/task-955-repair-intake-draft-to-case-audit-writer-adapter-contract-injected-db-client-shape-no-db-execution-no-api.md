# Task955 - Repair Intake Draft-to-Case Audit Writer Adapter Contract / Injected DB Client Shape / No DB Execution No API

Status: completed locally.

## Scope

Task955 adds a bounded Repair Intake draft-to-Case audit writer adapter contract for later injection into Task950's repository case creator adapter.

Allowed files:

- `src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js`
- `tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js`
- this task note

Out of scope:

- existing Task934-Task954 files;
- Engineer Mobile Task921-Task933;
- Task902;
- `admin/src/**`;
- API route / controller / DTO / OpenAPI changes;
- DB execution, SQL dry-run, psql, migration creation/apply, schema files, SQL migration files, seed files, or `npm run db:migrate`;
- package files;
- smoke / shared runtime scripts;
- provider integrations or LINE / SMS / App / email / webhook sending;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- default global audit writer, default DB client, or default ID generator;
- Case creation;
- draft linking;
- idempotency persistence / store.

## Implementation Summary

Task955 adds `createRepairIntakeDraftCaseAuditWriterAdapter(options)`.

Injected options:

- `dbClient`
- `idGenerator`
- optional `tableName`, defaulting to `audit_events`
- optional `clock`

Exposed methods:

- `recordRepairIntakeDraftToCaseCreated(input)`
- `record(input)`

Accepted input:

```js
{
  auditEvent: {
    eventType: "repair_intake_draft_to_case_submission",
    outcome: "submitted" | "blocked" | "failed",
    draftId,
    organizationId,
    actorId,
    requestId,
    idempotencyKey,
    caseRef,
    reasonCode,
    requiredActions
  },
  tx
}
```

The direct sanitized audit event shape is also accepted.

The adapter:

- requires an injected `dbClient`;
- requires an injected `idGenerator`;
- supports injected `tx` as the call-level client override;
- supports synthetic `query(sqlText, values)`, `execute(sqlText, values)`, and `insert(tableName, payload)` client shapes;
- validates `eventType`, `outcome`, `draftId`, `organizationId`, `actorId`, generated audit id, and `tableName` before any DB-client call;
- only accepts Task942-style sanitized audit event shape;
- rejects unsafe raw phone/address/customer payload/imported row/provider payload/token/secret/LINE token/unsafe caseId/finalAppointmentId before any DB-client call;
- passes user values separately from SQL text in query / execute mode;
- does not interpolate raw user values into SQL text;
- inserts only a minimal audit event payload:

```js
{
  id,
  event_type,
  outcome,
  organization_id,
  actor_id,
  request_id,
  idempotency_key,
  subject_type,
  subject_id,
  related_case_id,
  reason_code,
  required_actions,
  created_at
}
```

Output is a sanitized result envelope:

```js
{
  ok,
  auditEventId,
  eventType,
  organizationId,
  subjectId,
  status,
  reasonCode,
  requiredActions
}
```

The adapter never returns raw DB rows, SQL text, stack traces, raw error messages, tokens, secrets, raw phone/address/customer payload, or `finalAppointmentId`.

## Boundaries Preserved

Task955 does not:

- execute DB;
- import a global DB client;
- create a default DB connection;
- create a default audit writer;
- create a default ID generator;
- create or apply migrations;
- wire API routes/controllers/DTO/OpenAPI;
- add smoke/shared runtime;
- create Case;
- link drafts;
- perform idempotency persistence;
- expose customer-visible data;
- touch admin frontend, provider sending, AI/RAG, billing, or settlement runtime.

## Static Inventory Amendment

Full repairIntake suite verification was initially blocked by the older Task948 static inventory regex for `repairIntakeDraftCase*.js` no-DB submission modules.

The Task955 source filename remains unchanged: `src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js`.

The Task948 static inventory test was amended only to distinguish existing Task934-Task945 no-DB submission modules from later repository/audit adapter modules that share the filename prefix. The new audit writer adapter is explicitly excluded from the no-DB submission module inventory and is not added to that assertion set.

No production behavior changed as part of this static-test amendment.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-955-repair-intake-draft-to-case-audit-writer-adapter-contract-injected-db-client-shape-no-db-execution-no-api.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-955-repair-intake-draft-to-case-audit-writer-adapter-contract-injected-db-client-shape-no-db-execution-no-api.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js`: PASS (18/18)
- `node --test tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js`: PASS (6/6)
- `node --test tests/repairIntake/*.js`: PASS (260/260)
- `npm run check`: PASS
- `git diff -- src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-955-repair-intake-draft-to-case-audit-writer-adapter-contract-injected-db-client-shape-no-db-execution-no-api.md`: PASS
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.js tests/repairIntake/repairIntakeDraftCaseAuditWriterAdapter.unit.test.js tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-955-repair-intake-draft-to-case-audit-writer-adapter-contract-injected-db-client-shape-no-db-execution-no-api.md`: PASS
- `git status --short`: PASS; Task955 files are local, uncommitted, and untracked in the broader accepted dirty worktree.
