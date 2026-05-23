# Task945 - Repair Intake Draft-to-Case Submission Envelope Normalizer / Extracted Runtime Shape Guard / No Behavior Expansion

Status: completed locally.

## Scope

Task945 extracts the Repair Intake draft-to-Case submission service return envelope into a pure runtime normalizer.

In scope:

- `src/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionService.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`
- this task note

Out of scope:

- behavior expansion;
- modifying Task934-Task943 files except the explicitly allowed submission service/test;
- Engineer Mobile Task921-Task933;
- Task902;
- public API route / controller / DTO / OpenAPI changes;
- DB client usage, DB execution, SQL, psql, migration, schema, seed, fixture DB files, or `npm run db:migrate`;
- repositories or repository-backed readers/writers;
- default writer;
- default idempotency checker/store/writer;
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

`normalizeRepairIntakeDraftCaseSubmissionEnvelope(input)` always returns the exact internal service shape:

```js
{
  ok,
  action: 'repair_intake_draft_to_case_submit',
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

The normalizer:

- sets `action` to `repair_intake_draft_to_case_submit`;
- coerces missing booleans to `false`;
- coerces missing IDs to `null`;
- coerces missing `requiredActions` to an array;
- sanitizes `caseRef` to `{ id, organizationId, sourceDraftId, status }`;
- sanitizes `auditEvent` to the Task942 candidate shape.

`repairIntakeDraftCaseSubmissionService.js` delegates final envelope creation through this normalizer. Task944 behavior is preserved.

## Guard Rules

The normalizer strips unknown top-level fields and unknown nested fields.

It never returns raw phone, full address, customer payload, raw imported row payload, SQL, stack trace, provider payload, token, secret, LINE access token, unsafe `caseId`, or `finalAppointmentId`.

It never generates a Case ID, never infers `finalAppointmentId`, never calls DB/repository/store/provider/audit writer, and never mutates input.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.unit.test.js
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-945-repair-intake-draft-case-submission-envelope-normalizer-extracted-runtime-shape-guard-no-behavior-expansion.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-945-repair-intake-draft-case-submission-envelope-normalizer-extracted-runtime-shape-guard-no-behavior-expansion.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.unit.test.js`: PASS.
- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`: PASS.
- `node --test tests/repairIntake/*.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-945-repair-intake-draft-case-submission-envelope-normalizer-extracted-runtime-shape-guard-no-behavior-expansion.md`: PASS.
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionEnvelopeNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-945-repair-intake-draft-case-submission-envelope-normalizer-extracted-runtime-shape-guard-no-behavior-expansion.md`: PASS.
- `git status --short`: PASS. Task945 files are local / uncommitted, and new Task945 files are untracked.
