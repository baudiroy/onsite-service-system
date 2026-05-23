# Task941 - Repair Intake Draft-to-Case Creator Input Normalizer / Extracted Runtime Sanitizer / No Behavior Expansion

Status: completed locally.

## Scope

Task941 extracts and hardens sanitization of data passed into injected `caseCreator` into a pure production runtime normalizer.

Task939 normalized `caseCreator` result. Task941 normalizes `caseCreator` input so both sides of the injected writer seam are protected before any future real repository writer exists.

In scope:

- `src/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionService.js`
- `tests/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`

Out of scope:

- behavior expansion;
- real Case persistence;
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

`normalizeRepairIntakeDraftCaseCreatorInput(input)` accepts:

```js
{
  sanitizedCommand,
  planResult,
}
```

It returns:

```js
{
  ok: boolean,
  reasonCode: string,
  requiredActions: string[],
  creatorInput: object | null,
}
```

Allowed `creatorInput` shape:

```js
{
  command: {
    draftId,
    organizationId,
    actorId,
    requestId,
    idempotencyKey,
  },
  caseCandidate: {
    sourceDraftId,
    organizationId,
    brandId,
    serviceProviderId,
    intakeSource,
    serviceType,
    priority,
    reporterRef,
    customerRef,
    billingContactRef,
    siteRef,
    issueSummaryRef,
    createdByActorId,
  },
}
```

## Guard Rules

The normalizer blocks:

- missing `sanitizedCommand`;
- missing `planResult`;
- plan result not allowed;
- missing case candidate;
- organization mismatch between command and candidate;
- draft/sourceDraft mismatch between command and candidate.

It strips unsafe command, plan, candidate, and nested ref fields.

It never returns raw phone, full address, raw customer payload, imported row payload, SQL, stack trace, provider payload, token, secret, `caseId`, or `finalAppointmentId`.

It never generates a Case ID and does not mutate input.

## Submission Service Delegation

`repairIntakeDraftCaseSubmissionService.js` now delegates creator input normalization to `normalizeRepairIntakeDraftCaseCreatorInput` before calling injected `caseCreator`.

If creator input normalization blocks:

- `caseCreator` is not called;
- submission envelope shape remains stable;
- no behavior expands beyond extracted sanitization.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.unit.test.js
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-941-repair-intake-draft-case-creator-input-normalizer-extracted-runtime-sanitizer-no-behavior-expansion.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-941-repair-intake-draft-case-creator-input-normalizer-extracted-runtime-sanitizer-no-behavior-expansion.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.unit.test.js`: PASS.
- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`: PASS.
- `node --test tests/repairIntake/*.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-941-repair-intake-draft-case-creator-input-normalizer-extracted-runtime-sanitizer-no-behavior-expansion.md`: PASS. Task941 includes untracked files, so new-file content is represented by status until staged.
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseCreatorInputNormalizer.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-941-repair-intake-draft-case-creator-input-normalizer-extracted-runtime-sanitizer-no-behavior-expansion.md`: PASS.
- `git status --short`: PASS. Task941 files are local / uncommitted / untracked.
