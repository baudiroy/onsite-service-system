# Task1141 - Repair Intake Repository Implementation Planning Gate / No Runtime Change

## Status

Completed locally. Not staged.

## Accepted Baseline

Route propagation commits are accepted:

- `7536dd7` - `Repair Intake route propagation explicit injection`
- `cba085f` - `Document Repair Intake route propagation staging handoff`
- `13dd095` - `Document Repair Intake route propagation final checkpoint`

Runtime currently supports Repair Intake routes only through explicit injected runtime ports.

Server startup remains untouched.

Repository contracts exist for draft, case, idempotency, and audit persistence paths, but no real Repair Intake repository implementation is authorized by this task.

## Repository Implementation Candidates

The following are candidates only:

- Draft repository implementation for `findDraftForConversion`.
- Case repository implementation for `createCaseFromDraft`.
- Idempotency repository implementation for `findExistingDraftToCaseResult` and `recordDraftToCaseResult`.
- Audit repository implementation for `recordDraftToCaseDecision`, if the next persistence decision requires it.

## Required Prerequisites Before Implementation

- Approved schema and migration number.
- Disposable local/test DB target authorization.
- Transaction boundary decision.
- Organization or tenant isolation decision.
- Idempotency uniqueness scope.
- Audit retention and PII policy.
- Rollback plan.
- Explicit confirmation that no production, staging, or shared DB is touched.

## Recommended First Implementation Order

1. Draft repository read-only implementation first.
2. Idempotency repository next.
3. Case repository writer only after transaction and migration authorization.
4. Audit writer repository only after the audit persistence decision.

Read-only draft repository is the safest first implementation step because it can verify schema mapping and tenant scoping without creating cases or mutating idempotency state.

It still requires explicit DB authorization before any DB connection, SQL, repository import, or runtime implementation is created.

## Future Bounded Task Templates

Read-only draft repository implementation task:

- Conceptual files: `src/repositories/**`, focused unit tests under `tests/repairIntake/**`, and one task doc.
- Requires disposable/local DB authorization or a strict injected DB client contract.
- Must not create writer behavior.

Disposable DB dry-run authorization task:

- Conceptual files: one task doc only.
- Must name the disposable DB target, redaction rules, and allowed commands.
- Must explicitly forbid production, staging, or shared DB targets.

Migration proposal task:

- Conceptual files: `migrations/**`, migration README or task doc, and migration-specific tests if applicable.
- Must define table/column/index intent without applying to any DB unless separately authorized.

Idempotency repository implementation task:

- Conceptual files: idempotency repository implementation, focused unit tests, and one task doc.
- Must define uniqueness scope before writing.
- Must fail closed on missing organization or draft identity.

## Hard Fail-Closed Rule

Generic `continue runtime` is not enough for DB or repository implementation.

No DB connection, SQL, migration, or repository writer is allowed without exact task scope.

No full `DATABASE_URL`, token, secret, or credential value may be printed.

No imports from `src/repositories/**` or `src/db/**` may be added by this planning task.

## Local Worktree Warning

Task1141 doc remains untracked and unstaged.

`git diff --cached --name-only` must remain empty.

Existing unrelated dirty and untracked stack remains untouched.
