# Task944 - Repair Intake Draft-to-Case Submission Idempotency Checker Seam / Injected Checker / No Store No DB

Status: completed locally.

## Scope

Task944 adds an injected idempotency checker seam before Repair Intake draft-to-Case planning and Case creation.

In scope:

- `src/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionService.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`
- this task note

Out of scope:

- modifying Task934-Task943 files except the explicitly allowed submission service/test;
- Engineer Mobile Task921-Task933;
- Task902;
- public API route / controller / DTO / OpenAPI changes;
- DB client usage, DB execution, SQL, psql, migration, schema, seed, fixture DB files, or `npm run db:migrate`;
- repositories or repository-backed readers/writers;
- idempotency DB/store/default checker/default writer;
- default writer;
- audit persistence or default audit writer;
- real Case persistence beyond the injected test seam;
- admin frontend;
- smoke / shared runtime scripts;
- provider sending or LINE / SMS / App / email / webhook code;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- self-generated Case ID;
- `finalAppointmentId`.

## Runtime Behavior

`normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult(input)` accepts:

```js
{
  sanitizedCommand,
  checkerResult,
}
```

It returns:

```js
{
  ok: boolean,
  decision: 'available' | 'conflict' | 'failed',
  reasonCode: string,
  requiredActions: string[],
  caseRef: object | null,
}
```

`createRepairIntakeDraftCaseSubmissionService(options)` now supports:

```js
createRepairIntakeDraftCaseSubmissionService({
  planner,
  caseCreator,
  commandGuard,
  creatorInputNormalizer,
  submissionResultNormalizer,
  auditEventBuilder,
  idempotencyChecker,
  idempotencyResultNormalizer,
})
```

The service accepts idempotency checker functions and object methods:

- `checkDraftToCaseSubmission(command)`
- `check(command)`

The idempotency checker is required for submission to proceed. It runs after command guard and before planner. It receives only sanitized command fields.

The Task943 envelope remains stable; no new top-level fields were added:

```js
{
  ok,
  action,
  draftId,
  organizationId,
  submitted,
  caseCreationAllowed,
  candidateReady,
  reasonCode,
  requiredActions,
  caseRef,
  auditEvent,
}
```

## Guard Rules

The service:

- does not call idempotency checker, planner, or case creator if command guard blocks;
- blocks safely when idempotency checker is missing or invalid;
- blocks safely when idempotency checker throws;
- blocks safely when the normalizer returns conflict, failed, or unknown;
- blocks before planner and case creator when idempotency conflicts;
- may return sanitized existing `caseRef` for a conflict;
- attaches a blocked audit event when idempotency blocks and sanitized command exists;
- preserves submitted audit event on successful paths;
- never persists idempotency state, creates idempotency records, calls DB, calls a repository/store, calls a provider, or uses a default checker/writer.

The normalizer:

- requires sanitized command and checker result;
- supports available/pass results;
- supports conflict/duplicate results with optional sanitized existing case reference;
- supports failed/unknown checker results as safe blocks;
- rejects organization mismatch between command and conflict `caseRef`;
- rejects draft/sourceDraft mismatch between command and conflict `caseRef`;
- never generates a Case ID;
- never mutates input.

The idempotency path never returns raw phone, full address, customer payload, raw imported row payload, SQL, stack trace, provider payload, token, secret, LINE access token, unsafe `caseId`, or `finalAppointmentId`.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.unit.test.js
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-944-repair-intake-draft-case-submission-idempotency-checker-seam-injected-checker-no-store-no-db.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-944-repair-intake-draft-case-submission-idempotency-checker-seam-injected-checker-no-store-no-db.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.unit.test.js`: PASS.
- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`: PASS.
- `node --test tests/repairIntake/*.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-944-repair-intake-draft-case-submission-idempotency-checker-seam-injected-checker-no-store-no-db.md`: PASS.
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-944-repair-intake-draft-case-submission-idempotency-checker-seam-injected-checker-no-store-no-db.md`: PASS.
- `git status --short`: PASS. Task944 files are local / uncommitted, and new Task944 files are untracked.
