# Task951 - Repair Intake Case Creator Repository Adapter Static Boundary Test / Injected-Only Guard / No Runtime Change

Status: completed locally.

## Scope

Task951 adds test-only static boundary coverage for the Task950 repository adapter.

Allowed files:

- `tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapterBoundary.static.test.js`
- this task note

Out of scope:

- `src/**`;
- modifying Task934-Task950 files;
- `admin/src/**`;
- API route / controller / DTO / OpenAPI changes;
- DB execution, SQL, psql, migration creation/apply, schema files, seed files, or `npm run db:migrate`;
- concrete repository files;
- package files;
- smoke / shared runtime scripts;
- provider integrations or LINE / SMS / App / email / webhook sending;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- default repositories, default writer, default audit writer, audit persistence implementation, or default idempotency checker/store/writer;
- Task902;
- Engineer Mobile Task921-Task933.

## Static Boundary Coverage

The static test reads `src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js` and asserts:

- the adapter imports only accepted local helpers:
  - `./repairIntakeDraftCaseSubmissionAuditEventBuilder`
  - `./repairIntakeDraftCaseSubmissionResultNormalizer`
- imports do not target DB/database/SQL/migration, repositories, routes/controllers/DTO/OpenAPI, providers, LINE/SMS/App/email/webhook, AI/RAG/vector, billing/settlement/payment/invoice, admin, smoke, shared runtime, or common DB/AI packages;
- source does not construct default repositories, writers, DB clients, providers, repository-backed writers, audit persistence, raw SQL helpers, or query executors;
- sensitive field names such as `finalAppointmentId`, `fullAddress`, `rawAddress`, `phoneNumber`, `lineAccessToken`, `tokenSecret`, `rawCustomerPayload`, and `rawImportedRow` do not appear outside the explicit Task950 input deny-list;
- accepted injected seam names remain allowed: `caseRepository`, `repairIntakeDraftRepository`, `transactionRunner`, and `auditWriter`;
- accepted safe terms remain allowed: `caseRef`, `sourceDraftId`, `organizationId`, `idempotencyKey`, and sanitized `id`.

## Boundaries Preserved

Task951 does not change runtime behavior. It does not modify production source, wire the adapter into submission service/API/default runtime, add DB execution, create or apply migrations, add smoke/shared runtime, touch admin frontend, add provider sending, add AI/RAG, or touch billing/settlement code.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapterBoundary.static.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapterBoundary.static.test.js docs/task-951-repair-intake-case-creator-repository-adapter-static-boundary-test-injected-only-guard-no-runtime-change.md
git diff --check -- tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapterBoundary.static.test.js docs/task-951-repair-intake-case-creator-repository-adapter-static-boundary-test-injected-only-guard-no-runtime-change.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapterBoundary.static.test.js`: PASS (5/5)
- `node --test tests/repairIntake/*.js`: PASS (187/187)
- `npm run check`: PASS
- `git diff -- tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapterBoundary.static.test.js docs/task-951-repair-intake-case-creator-repository-adapter-static-boundary-test-injected-only-guard-no-runtime-change.md`: PASS
- `git diff --check -- tests/repairIntake/repairIntakeCaseCreatorRepositoryAdapterBoundary.static.test.js docs/task-951-repair-intake-case-creator-repository-adapter-static-boundary-test-injected-only-guard-no-runtime-change.md`: PASS
- `git status --short`: PASS; Task951 files are local, uncommitted, and untracked in the broader accepted dirty worktree.
