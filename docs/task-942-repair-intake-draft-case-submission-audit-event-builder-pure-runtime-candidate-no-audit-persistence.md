# Task942 - Repair Intake Draft-to-Case Submission Audit Event Builder / Pure Runtime Candidate / No Audit Persistence

Status: completed locally.

## Scope

Task942 adds a pure production runtime builder for sanitized audit event candidates in the Repair Intake draft-to-Case submission flow.

In scope:

- `src/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.unit.test.js`
- this task note

Out of scope:

- modifying Task934-Task941 files;
- Engineer Mobile Task921-Task933;
- Task902;
- audit persistence;
- default audit writer;
- repository-backed writer;
- DB client usage, DB execution, SQL, psql, migration, schema, seed, fixture DB files, or `npm run db:migrate`;
- route / controller / API / DTO / OpenAPI changes;
- real Case persistence;
- admin frontend;
- smoke / shared runtime scripts;
- provider sending or LINE / SMS / App / email / webhook code;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- self-generated Case ID;
- `finalAppointmentId`.

## Runtime Behavior

`buildRepairIntakeDraftCaseSubmissionAuditEvent(input)` accepts:

```js
{
  sanitizedCommand,
  planResult,
  creatorInput,
  submissionResult,
  outcome,
}
```

It returns:

```js
{
  ok: boolean,
  reasonCode: string,
  requiredActions: string[],
  auditEvent: object | null,
}
```

Successful output uses this sanitized candidate shape:

```js
{
  eventType: 'repair_intake_draft_to_case_submission',
  outcome: 'submitted' | 'blocked' | 'failed',
  draftId,
  organizationId,
  actorId,
  requestId,
  idempotencyKey,
  caseRef: {
    id,
    organizationId,
    sourceDraftId,
    status,
  } | null,
  reasonCode,
  requiredActions,
}
```

## Guard Rules

The builder blocks:

- missing input;
- missing sanitized command;
- missing draft ID;
- missing organization scope;
- missing actor ID;
- missing outcome;
- submitted outcome without a valid case reference;
- case reference organization mismatch;
- case reference source draft mismatch.

The builder supports `submitted`, `blocked`, and `failed` outcomes.

The builder only creates an audit event candidate. It does not persist audit records, call an audit writer, call a repository, call DB, call providers, generate Case IDs, infer `finalAppointmentId`, or mutate input.

The builder is allowlist-based and never returns raw phone, full address, customer payload, raw imported row payload, SQL, stack trace, provider payload, token, secret, LINE access token, unsafe `caseId`, or `finalAppointmentId`.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.js tests/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.unit.test.js docs/task-942-repair-intake-draft-case-submission-audit-event-builder-pure-runtime-candidate-no-audit-persistence.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.js tests/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.unit.test.js docs/task-942-repair-intake-draft-case-submission-audit-event-builder-pure-runtime-candidate-no-audit-persistence.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.unit.test.js`: PASS.
- `node --test tests/repairIntake/*.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.js tests/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.unit.test.js docs/task-942-repair-intake-draft-case-submission-audit-event-builder-pure-runtime-candidate-no-audit-persistence.md`: PASS. Task942 files are untracked, so new-file content is represented by status until staged.
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.js tests/repairIntake/repairIntakeDraftCaseSubmissionAuditEventBuilder.unit.test.js docs/task-942-repair-intake-draft-case-submission-audit-event-builder-pure-runtime-candidate-no-audit-persistence.md`: PASS.
- `git status --short`: PASS. Task942 files are local / uncommitted / untracked.
