# Task950 - Repair Intake Draft-to-Case Repository Case Creator Adapter / Injected Repositories / No API No Migration

Status: completed locally.

## Scope

Task950 adds the first bounded production repository adapter for the accepted Repair Intake draft-to-Case injected `caseCreator` seam.

Allowed files:

- `src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js`
- `tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.unit.test.js`
- this task note

Out of scope:

- `src/repairIntake/repairIntakeDraftCaseSubmissionService.js`;
- existing Task934-Task949 files;
- Engineer Mobile Task921-Task933;
- Task902;
- `admin/src/**`;
- API route / controller / DTO / OpenAPI changes;
- DB execution, SQL, psql, migration creation/apply, schema files, seed files, or `npm run db:migrate`;
- package files;
- smoke / shared runtime scripts;
- provider integrations or LINE / SMS / App / email / webhook sending;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- default repositories, default writer, default idempotency checker/store/writer, default audit writer, or concrete DB client imports.

## Implementation Summary

Task950 adds `createRepairIntakeCaseCreatorRepositoryAdapter(options)`.

The adapter exposes methods compatible with the existing Task938-Task945 injected `caseCreator` seam:

- `createCaseFromCandidate(creatorInput)`
- `create(creatorInput)`

Injected dependencies:

- `caseRepository`
- `repairIntakeDraftRepository`
- `transactionRunner`
- `auditWriter`
- optional `clock`

Supported injected method names:

- `caseRepository.createCaseFromRepairIntakeCandidate(input)` or `caseRepository.create(input)`, or a function.
- `repairIntakeDraftRepository.markDraftLinkedToCase(input)` or `repairIntakeDraftRepository.markLinkedToCase(input)`, or a function.
- `auditWriter.recordRepairIntakeDraftToCaseCreated(input)` or `auditWriter.record(input)`, or a function.
- `transactionRunner.runInTransaction(callback)` or `transactionRunner.transaction(callback)`, or a function.

The adapter:

- accepts normalized Task941-style creator input only;
- rejects unsafe input containing raw phone, address, customer payload, imported row payload, provider payload, token, secret, LINE token, unsafe `caseId`, or `finalAppointmentId`;
- validates organization and draft/sourceDraft consistency before writing;
- runs create-case, mark-draft-linked, and audit write inside the injected transaction runner;
- passes `tx` through to injected dependencies without assuming a real DB client shape;
- uses existing Task939 result normalization for repository-created Case refs;
- uses existing Task942 audit event builder to produce a sanitized audit candidate for the injected audit writer;
- returns only the sanitized creator result expected by Task939 on success:

```js
{
  id,
  organizationId,
  sourceDraftId,
  status,
}
```

Failures return safe reason envelopes without raw error leakage.

## Boundaries Preserved

Task950 does not:

- wire the adapter into the submission service;
- create default repositories or a default audit writer;
- import a DB client;
- execute DB calls directly;
- execute raw SQL;
- add or apply migrations;
- modify API routes, controllers, DTOs, or OpenAPI;
- add smoke/shared runtime;
- touch admin frontend;
- add provider sending, AI/RAG, billing, or settlement runtime.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.unit.test.js docs/task-950-repair-intake-draft-to-case-repository-case-creator-adapter-injected-repositories-no-api-no-migration.md
git diff --check -- src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.unit.test.js docs/task-950-repair-intake-draft-to-case-repository-case-creator-adapter-injected-repositories-no-api-no-migration.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.unit.test.js`: PASS (19/19)
- `node --test tests/repairIntake/*.js`: PASS (182/182)
- `npm run check`: PASS
- `git diff -- src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.unit.test.js docs/task-950-repair-intake-draft-to-case-repository-case-creator-adapter-injected-repositories-no-api-no-migration.md`: PASS
- `git diff --check -- src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.unit.test.js docs/task-950-repair-intake-draft-to-case-repository-case-creator-adapter-injected-repositories-no-api-no-migration.md`: PASS
- `git status --short`: PASS; Task950 files are local, uncommitted, and untracked in the broader accepted dirty worktree.
