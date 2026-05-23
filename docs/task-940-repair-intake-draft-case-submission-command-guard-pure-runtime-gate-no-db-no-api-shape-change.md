# Task940 - Repair Intake Draft-to-Case Submission Command Guard / Pure Runtime Gate / No DB No API Shape Change

Status: completed locally.

## Scope

Task940 adds a pure runtime command guard before draft-to-Case submission so the Task938 submission service cannot call `planner` or injected `caseCreator` unless the sanitized command includes required safety metadata.

This prepares for future real Case creation, but does not authorize DB, repository writer, API route, audit persistence, provider sending, or real permission lookup.

In scope:

- `src/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.js`
- `src/repairIntake/repairIntakeDraftCaseSubmissionService.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.unit.test.js`
- `tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`

Out of scope:

- real auth / session / permission lookup;
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

`validateRepairIntakeDraftCaseSubmissionCommand(input)` returns:

```js
{
  ok: boolean,
  reasonCode: string,
  requiredActions: string[],
  sanitizedCommand: object | null,
}
```

The guard requires sanitized command metadata:

- `draftId`
- `organizationId`
- `actorId`
- `idempotencyKey`
- human / platform approval marker
- injected permission marker

The guard does not perform real auth / session / permission lookup. It only checks explicit sanitized markers provided by the caller.

## Guard Rules

The guard blocks:

- missing command;
- missing `draftId`;
- missing `organizationId`;
- missing `actorId`;
- missing `idempotencyKey`;
- missing human / platform approval marker;
- missing permission marker.

Returned `sanitizedCommand` strips raw phone, full address, customer payload, SQL, stack trace, provider payload, token, secret, raw imported row payload, `caseId`, and `finalAppointmentId`.

## Submission Service Delegation

`repairIntakeDraftCaseSubmissionService.js` now supports:

```js
createRepairIntakeDraftCaseSubmissionService({
  planner,
  caseCreator,
  commandGuard = validateRepairIntakeDraftCaseSubmissionCommand,
})
```

If command guard blocks:

- planner is not called;
- `caseCreator` is not called;
- the returned submission envelope shape remains stable.

If command guard passes, only `sanitizedCommand` is passed to planner.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.unit.test.js
node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-940-repair-intake-draft-case-submission-command-guard-pure-runtime-gate-no-db-no-api-shape-change.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-940-repair-intake-draft-case-submission-command-guard-pure-runtime-gate-no-db-no-api-shape-change.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.unit.test.js`: PASS.
- `node --test tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js`: PASS.
- `node --test tests/repairIntake/*.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-940-repair-intake-draft-case-submission-command-guard-pure-runtime-gate-no-db-no-api-shape-change.md`: PASS. Task940 includes untracked files, so new-file content is represented by status until staged.
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.js src/repairIntake/repairIntakeDraftCaseSubmissionService.js tests/repairIntake/repairIntakeDraftCaseSubmissionCommandGuard.unit.test.js tests/repairIntake/repairIntakeDraftCaseSubmissionService.unit.test.js docs/task-940-repair-intake-draft-case-submission-command-guard-pure-runtime-gate-no-db-no-api-shape-change.md`: PASS.
- `git status --short`: PASS. Task940 files are local / uncommitted / untracked.
