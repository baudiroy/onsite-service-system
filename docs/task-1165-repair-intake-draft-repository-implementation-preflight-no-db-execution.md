# Task1165 - Repair Intake Draft Repository Implementation Preflight / No DB Execution

## Status

Completed locally. Not staged.

This is a docs-only implementation preflight for the safest next repository step: read-only Repair Intake draft repository implementation.

This task does not create repository source.

It does not execute DB commands, SQL, migration dry-run, migration apply, `psql`, or `db:migrate`.

It does not modify source/runtime files, migration SQL files, tests, package files, routes, APIs, providers, admin files, AI, billing, repository writers, or DB behavior.

It does not perform git staging, commit, cleanup, revert, reset, or stash.

## Accepted Baseline

Task1141 repository implementation planning gate is accepted.

Task1164 migration / DB execution branch checkpoint is accepted.

Migration 026 is committed but not executed.

Route propagation remains explicit-injection-only.

Repository contract exists for `findDraftForConversion`.

No real Repair Intake repository implementation exists yet in this branch.

## Proposed Future Repository Seam

Proposed future source file:

`src/repairIntake/repairIntakeDraftRepository.js`

Proposed future test file:

`tests/repairIntake/repairIntakeDraftRepository.unit.test.js`

The future repository should:

- accept injected `dbClient` only;
- avoid global DB imports;
- avoid `process.env`;
- avoid repository writer behavior;
- expose a read-only method only: `findDraftForConversion(input)`;
- remain compatible with `createRepairIntakeDraftRepositoryContract`;
- remain compatible with `createRepairIntakeDraftReaderPortAdapter`.

## Future Method Behavior Proposal

`findDraftForConversion(input)` should:

- require a sanitized `draftId`;
- require organization and tenant scope where available;
- query `repair_intake_drafts` only;
- return a safe draft-like object compatible with the existing contract;
- return `null` or a not-found-compatible value when no row exists;
- catch DB errors and return or throw a sanitized repository-layer error consistent with existing contract expectations;
- never expose raw SQL, raw DB row, credentials, phone, address, customer PII, LINE identifiers, or `finalAppointmentId`.

Expected safe response fields should be limited to contract-compatible fields such as:

- `draftId`
- `organizationId`
- `tenantId`
- `status`
- `source`
- `sourceRef`
- `intakeSource`
- `summary`
- `metadata`
- `warnings`

## Future SQL Boundary

No SQL execution is allowed in this task.

Future implementation may include a parameterized query string in source.

Future implementation must not interpolate user input into SQL strings.

Future implementation must not include `INSERT`, `UPDATE`, `DELETE`, destructive SQL, migration execution, or writer behavior.

Future implementation should be `SELECT` only.

## Prerequisites Before Future Source Task

- Migration 026 should be accepted as schema proposal.
- Disposable DB dry-run remains optional and separately authorized.
- Initial implementation can be unit-tested with synthetic `dbClient` only before any real DB execution.
- Production, staging, shared, and runtime DB remain forbidden.
- No full `DATABASE_URL`, credentials, tokens, or secrets may be printed.

## Fail-Closed Rules

- No global DB import.
- No `DATABASE_URL`.
- No `process.env`.
- No `psql`.
- No `db:migrate`.
- No writer method.
- No DB execution.
- No source creation until the next bounded task.
- No route/API/provider/admin/AI/billing/package changes.

## Recommended Next Bounded Task

Create read-only repository implementation with injected synthetic `dbClient` and unit tests, still no DB execution.

Exact future allowed files should be:

- `src/repairIntake/repairIntakeDraftRepository.js`
- `tests/repairIntake/repairIntakeDraftRepository.unit.test.js`
- `docs/task-1166-repair-intake-draft-repository-read-only-implementation-no-db-execution.md`

The future task should continue to forbid real DB connections, `psql`, `db:migrate`, migration dry-run/apply, repository writers, and route/API/provider/admin/AI/billing changes.

## Local Git Warning

Task1165 remains untracked and unstaged.

`git diff --cached --name-only` must remain empty.

Unrelated dirty and untracked files remain untouched.
