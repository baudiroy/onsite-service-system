# Task948 - Repair Intake Draft-to-Case No-DB Submission Static Boundary Test / Import Guard / No Production Change

Status: completed locally.

## Scope

Task948 adds a test-only static boundary guard for the accepted Task934-Task945 Repair Intake draft-to-Case no-DB submission modules.

In scope:

- `tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js`
- this task note

Out of scope:

- `src/**`;
- modifying Task934-Task947 files except the new Task948 files;
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

## Static Boundary Coverage

The static test reads the accepted no-DB submission production modules as text and asserts:

- every current `src/repairIntake/repairIntakeDraftCase*.js` module is covered;
- import / require specifiers stay within accepted local `repairIntakeDraftCase*` modules;
- imports do not target DB, repository, route/controller/API/OpenAPI, provider sending, AI/RAG/vector, billing, admin, smoke, or shared runtime paths;
- source text does not contain forbidden runtime boundary identifiers for DB/query clients, repositories, route/controller/API code, provider sending clients, AI/RAG/vector runtime, billing, audit persistence/default audit writer, default writer, default idempotency store/checker/writer, admin frontend, or smoke/shared runtime;
- source text does not contain forbidden sensitive field names: `finalAppointmentId`, `fullAddress`, `rawAddress`, `phoneNumber`, `lineAccessToken`, `tokenSecret`, `rawCustomerPayload`, or `rawImportedRow`;
- source text does not generate or expose unsafe `caseId` fields while allowing accepted sanitized `caseRef.id`, `sourceDraftId`, `organizationId`, `idempotencyKey`, and sanitized `id` handling.

## Boundaries Preserved

Task948 is test/doc only. It does not modify production source, API shape, DB/migration files, providers, audit persistence, repository-backed writers/readers, admin frontend, smoke/shared runtime, AI/RAG, or billing code.

The accepted injected seams remain allowed where already present, including synthetic / injected planner, draft reader, case creator, idempotency checker, and audit event builder. The guard targets default persistence or forbidden runtime dependencies, not accepted no-DB injection seams.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-948-repair-intake-draft-to-case-no-db-submission-static-boundary-test-import-guard-no-production-change.md
git diff --check -- tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-948-repair-intake-draft-to-case-no-db-submission-static-boundary-test-import-guard-no-production-change.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js`: PASS (5/5)
- `node --test tests/repairIntake/*.js`: PASS (163/163)
- `npm run check`: PASS
- `git diff -- tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-948-repair-intake-draft-to-case-no-db-submission-static-boundary-test-import-guard-no-production-change.md`: PASS
- `git diff --check -- tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-948-repair-intake-draft-to-case-no-db-submission-static-boundary-test-import-guard-no-production-change.md`: PASS
- `git status --short`: PASS; Task948 files are local, uncommitted, and untracked in the broader accepted dirty worktree.
