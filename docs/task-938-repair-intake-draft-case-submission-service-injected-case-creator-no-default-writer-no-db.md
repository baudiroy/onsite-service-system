# Task938 - Repair Intake Draft-to-Case Submission Service / Injected Case Creator / No Default Writer No DB

Status: completed locally.

## Scope

Task938 adds a production runtime submission service that takes a Task937-style draft-to-Case plan and, only when allowed, calls an explicitly injected `caseCreator`.

This is an injected submission interface only. It does not provide a default writer, repository-backed writer, DB access, API route, migration, or provider sending.

In scope:

- `src/repairIntake/repairIntakeDraftCaseSubmissionService.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`

Out of scope:

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

`createRepairIntakeDraftCaseSubmissionService({ planner, caseCreator })` creates a dependency-injected service with one method:

```js
submitDraftToCase(input)
```

The service passes sanitized input only to the planner:

- `draftId`
- `organizationId`
- optional `actorId`
- optional `requestId`

The service calls `caseCreator` only when the planner returns:

- `caseCreationAllowed === true`
- `candidateReady === true`
- non-null sanitized `caseCandidate`

The service passes only sanitized candidate and context fields to `caseCreator`.

## Submission Envelope

The service returns:

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
}
```

`caseRef` may contain only sanitized reference fields returned by injected `caseCreator`:

```js
{
  id: string,
  organizationId: string,
  sourceDraftId: string,
  status: string,
}
```

## Failure Safety

The service returns safe blocked envelopes for:

- missing or invalid planner;
- planner failure;
- blocked / needs-review / not-allowed plan;
- missing candidate;
- missing or invalid `caseCreator`;
- creator failure;
- invalid creator result.

It never leaks raw error messages, SQL, stack traces, provider payloads, tokens, secrets, raw phone, full address, customer raw payload, `caseId`, or `finalAppointmentId`.

## Implementation Boundary

The module does not call DB, repository, provider, audit writer, AI, billing, API, route, controller, or smoke/shared runtime code.

The module does not generate `caseId` by itself and does not mutate input.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-938-repair-intake-draft-case-submission-service-injected-case-creator-no-default-writer-no-db.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-938-repair-intake-draft-case-submission-service-injected-case-creator-no-default-writer-no-db.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`: PASS.
- `node --test tests/repairIntake/*.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-938-repair-intake-draft-case-submission-service-injected-case-creator-no-default-writer-no-db.md`: PASS. No output because Task938 files are untracked.
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-938-repair-intake-draft-case-submission-service-injected-case-creator-no-default-writer-no-db.md`: PASS.
- `git status --short`: PASS. Task938 files are local / uncommitted / untracked.
