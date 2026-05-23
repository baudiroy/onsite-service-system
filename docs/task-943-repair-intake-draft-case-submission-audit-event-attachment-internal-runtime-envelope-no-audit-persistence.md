# Task943 - Repair Intake Draft-to-Case Submission Audit Event Attachment / Internal Runtime Envelope / No Audit Persistence

Status: completed locally.

## Scope

Task943 wires the Repair Intake draft-to-Case submission service to the Task942 audit event candidate builder.

In scope:

- `src/repairIntake/repairIntakeDraftCaseSubmissionService.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`
- this task note

Out of scope:

- modifying Task934-Task942 files except the explicitly allowed submission service/test;
- Engineer Mobile Task921-Task933;
- Task902;
- public API route / controller / DTO / OpenAPI changes;
- audit persistence;
- default audit writer;
- repository-backed writer;
- DB client usage, DB execution, SQL, psql, migration, schema, seed, fixture DB files, or `npm run db:migrate`;
- real Case persistence beyond the injected test seam;
- admin frontend;
- smoke / shared runtime scripts;
- provider sending or LINE / SMS / App / email / webhook code;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- self-generated Case ID;
- `finalAppointmentId`.

## Runtime Behavior

`createRepairIntakeDraftCaseSubmissionService(options)` now supports:

```js
createRepairIntakeDraftCaseSubmissionService({
  planner,
  caseCreator,
  commandGuard,
  creatorInputNormalizer,
  submissionResultNormalizer,
  auditEventBuilder,
})
```

`auditEventBuilder` defaults to `buildRepairIntakeDraftCaseSubmissionAuditEvent`.

The internal service envelope is expanded only by adding `auditEvent`:

```js
{
  ok: boolean,
  action: 'repair_intake_draft_to_case_submit',
  draftId: string | null,
  organizationId: string | null,
  submitted: boolean,
  caseCreationAllowed: boolean,
  candidateReady: boolean,
  reasonCode: string,
  requiredActions: string[],
  caseRef: object | null,
  auditEvent: object | null,
}
```

When present, `auditEvent` uses the sanitized Task942 candidate shape:

```js
{
  eventType: 'repair_intake_draft_to_case_submission',
  outcome: 'submitted' | 'blocked' | 'failed',
  draftId,
  organizationId,
  actorId,
  requestId,
  idempotencyKey,
  caseRef,
  reasonCode,
  requiredActions,
}
```

## Guard Rules

The service still runs the submission flow in the same order:

1. command guard;
2. planner;
3. creator input normalizer;
4. injected case creator;
5. submission result normalizer.

The service attaches:

- `auditEvent: null` when command validation blocks before a valid sanitized command exists;
- blocked audit candidate for planner blocked / needs-review paths;
- blocked audit candidate for creator input normalization blocks;
- failed audit candidate for creator failures or creator result normalization failures;
- submitted audit candidate for successful submissions.

Audit candidate attachment is internal only. It never persists audit records, calls an audit writer, calls DB, calls a repository, calls a provider, changes route/controller/API/OpenAPI shape, generates Case IDs, infers `finalAppointmentId`, or mutates input.

Audit builder errors are fail-safe: they never throw from the submission service and never turn a successful submission into a failed submission. If audit attachment fails on an otherwise successful submission, the service keeps `ok: true`, returns `auditEvent: null`, and adds `REVIEW_AUDIT_EVENT_ATTACHMENT` to `requiredActions`.

The audit event path never returns raw phone, full address, customer payload, raw imported row payload, SQL, stack trace, provider payload, token, secret, LINE access token, unsafe `caseId`, or `finalAppointmentId`.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-943-repair-intake-draft-case-submission-audit-event-attachment-internal-runtime-envelope-no-audit-persistence.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-943-repair-intake-draft-case-submission-audit-event-attachment-internal-runtime-envelope-no-audit-persistence.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`: PASS.
- `node --test tests/repairIntake/*.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-943-repair-intake-draft-case-submission-audit-event-attachment-internal-runtime-envelope-no-audit-persistence.md`: PASS.
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-943-repair-intake-draft-case-submission-audit-event-attachment-internal-runtime-envelope-no-audit-persistence.md`: PASS.
- `git status --short`: PASS. Task943 files are local / uncommitted, and the Task943 note is untracked.
