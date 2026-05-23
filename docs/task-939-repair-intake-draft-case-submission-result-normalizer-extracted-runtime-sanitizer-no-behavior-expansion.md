# Task939 - Repair Intake Draft-to-Case Submission Result Normalizer / Extracted Runtime Sanitizer / No Behavior Expansion

Status: completed locally.

## Scope

Task939 extracts submission result sanitization into a pure production runtime normalizer and updates the Task938 submission service to delegate creator result normalization to it.

This prepares the future real writer boundary while preserving Task938 behavior and envelope shape.

In scope:

- `src/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionService.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`

Out of scope:

- behavior expansion;
- repository-backed writer implementation;
- default writer;
- DB client usage;
- DB, SQL, psql, migration, schema, seed, fixture DB files, or `npm run db:migrate`;
- route / controller / API exposure;
- API DTO or OpenAPI shape changes;
- audit persistence;
- provider sending or LINE / SMS / App / email / webhook code;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- admin frontend;
- smoke / shared runtime changes;
- self-generated Case ID;
- `finalAppointmentId`;
- Engineer Mobile Task921-Task933.

## Runtime Behavior

`normalizeRepairIntakeDraftCaseSubmissionResult(input)` accepts explicit sanitized context:

```js
{
  draftId,
  organizationId,
  sourceDraftId,
  creatorResult,
}
```

It returns:

```js
{
  ok: boolean,
  reasonCode: string,
  requiredActions: string[],
  caseRef: object | null,
}
```

`caseRef` may contain only:

```js
{
  id: string,
  organizationId: string,
  sourceDraftId: string,
  status: string,
}
```

The normalizer:

- strips unsafe fields from `creatorResult`;
- blocks missing creator result;
- blocks missing case ref id;
- blocks missing organization;
- blocks organization mismatch;
- blocks source draft mismatch when both sides are present and different;
- blocks missing status;
- never generates a Case ID;
- never infers or exposes `finalAppointmentId`;
- never returns raw phone, full address, customer payload, SQL, stack trace, provider data, token, secret, or raw imported row payload;
- returns stable reason codes and required actions;
- does not mutate input.

## Task938 Delegation

`repairIntakeDraftCaseSubmissionService.js` now delegates creator result normalization to `normalizeRepairIntakeDraftCaseSubmissionResult`.

Task938's submission envelope shape remains unchanged:

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
}
```

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.unit.test.js
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-939-repair-intake-draft-case-submission-result-normalizer-extracted-runtime-sanitizer-no-behavior-expansion.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-939-repair-intake-draft-case-submission-result-normalizer-extracted-runtime-sanitizer-no-behavior-expansion.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.unit.test.js`: PASS.
- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`: PASS.
- `node --test tests/repairIntake/*.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-939-repair-intake-draft-case-submission-result-normalizer-extracted-runtime-sanitizer-no-behavior-expansion.md`: PASS. Task939 includes untracked files, so new-file content is represented by status until staged.
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionResultNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-939-repair-intake-draft-case-submission-result-normalizer-extracted-runtime-sanitizer-no-behavior-expansion.md`: PASS.
- `git status --short`: PASS. Task939 files are local / uncommitted / untracked.
