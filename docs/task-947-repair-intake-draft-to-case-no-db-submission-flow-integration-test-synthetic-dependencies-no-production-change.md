# Task947 - Repair Intake Draft-to-Case No-DB Submission Flow Integration Test / Synthetic Dependencies / No Production Change

Status: completed locally.

## Scope

Task947 adds test-only no-DB integration-style coverage for the accepted Task934-Task945 Repair Intake draft-to-Case submission runtime pipeline.

In scope:

- `tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionFlow.integration.test.js`
- this task note

Out of scope:

- `src/**`;
- modifying Task934-Task946 docs or tests except the new Task947 files;
- Engineer Mobile Task921-Task933;
- Task902;
- `admin/src/**`;
- API route / controller / DTO / OpenAPI changes;
- DB, SQL, psql, migration, schema, seed, fixture DB files, or `npm run db:migrate`;
- repositories or repository-backed readers/writers;
- default writer;
- default idempotency checker/store/writer;
- audit persistence or default audit writer;
- provider sending or LINE / SMS / App / email / webhook code;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- smoke / shared runtime scripts;
- package manager files.

## Test Coverage

The integration test composes existing accepted runtime modules with synthetic injected dependencies:

- Task934 eligibility evaluator through the planning service default;
- Task936 candidate builder through the planning service default;
- Task937 planning service;
- Task938-Task945 submission service path;
- synthetic `draftReader`;
- synthetic `idempotencyChecker`;
- synthetic `caseCreator`.

Covered paths:

- eligible synthetic draft submits successfully through the no-DB flow;
- successful path returns sanitized `caseRef`;
- successful path returns submitted audit event candidate only;
- synthetic `caseCreator` receives normalized / sanitized creator input;
- blocked eligibility path does not call `caseCreator`;
- idempotency conflict path does not call planner draft reader or `caseCreator`;
- idempotency conflict may return sanitized existing `caseRef`;
- command guard failure path does not call idempotency checker, planner draft reader, or `caseCreator`;
- final envelope remains the Task945 stable internal shape;
- raw phone, full address, customer payload, raw imported row payload, SQL, stack trace, provider payload, token, secret, LINE access token, unsafe `caseId`, and `finalAppointmentId` are not returned.

## Boundaries Preserved

The test uses only synthetic injected functions and objects. It does not use real DB, repository, store, provider, audit writer, default writer, default idempotency checker/store, API route/controller, smoke/shared runtime, or production persistence.

No production source files are changed by Task947.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionFlow.integration.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionFlow.integration.test.js docs/task-947-repair-intake-draft-to-case-no-db-submission-flow-integration-test-synthetic-dependencies-no-production-change.md
git diff --check -- tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionFlow.integration.test.js docs/task-947-repair-intake-draft-to-case-no-db-submission-flow-integration-test-synthetic-dependencies-no-production-change.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionFlow.integration.test.js`: PASS (4/4)
- `node --test tests/repairIntake/*.js`: PASS (158/158)
- `npm run check`: PASS
- `git diff -- tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionFlow.integration.test.js docs/task-947-repair-intake-draft-to-case-no-db-submission-flow-integration-test-synthetic-dependencies-no-production-change.md`: PASS
- `git diff --check -- tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionFlow.integration.test.js docs/task-947-repair-intake-draft-to-case-no-db-submission-flow-integration-test-synthetic-dependencies-no-production-change.md`: PASS
- `git status --short`: PASS; Task947 files are local, uncommitted, and untracked in the broader accepted dirty worktree.
