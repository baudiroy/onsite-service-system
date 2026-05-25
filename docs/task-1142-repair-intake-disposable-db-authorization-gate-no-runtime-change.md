# Task1142 - Repair Intake Disposable DB Authorization Gate / No Runtime Change

## Status

Completed locally. Not staged.

## Accepted Baseline

Route propagation commit stack is accepted:

- `7536dd7` - `Repair Intake route propagation explicit injection`
- `cba085f` - `Document Repair Intake route propagation staging handoff`
- `13dd095` - `Document Repair Intake route propagation final checkpoint`

Task1141 repository implementation planning gate is accepted.

Repair Intake route propagation is explicit-injection-only.

Server startup remains untouched.

Repository contracts exist, but no real Repair Intake repository implementation is authorized by this task.

## Disposable DB Authorization Scope

Future DB work may target disposable local/test DB only.

Production, staging, and shared DB targets are explicitly forbidden unless separately authorized.

Full credentials and full `DATABASE_URL` values must never be printed.

Any DB proof must use sanitized environment evidence only, such as a redacted URL host label, disposable DB name, or local container name.

## Required User Authorization Wording For Future DB Task

Future DB work must require explicit wording equivalent to:

- `I authorize disposable local/test DB use for Repair Intake.`
- `Do not use production/staging/shared DB.`
- `Do not print full DATABASE_URL or credentials.`
- `Migration creation/dry-run/apply scope is [exact scope].`

## Required Technical Prerequisites Before Any DB Command

- Exact migration file number and name.
- Exact schema/table proposal accepted.
- Rollback plan.
- Transaction boundary decision.
- Organization or tenant isolation fields.
- Idempotency uniqueness scope.
- Audit persistence scope.
- PII and raw payload retention policy.
- Approved command list.

## Fail-Closed Rules

- Generic `continue runtime` is not enough for DB work.
- No DB command is allowed without a disposable DB target.
- No SQL, `psql`, or `db:migrate` is allowed without an explicit bounded task.
- No migration file is allowed without an explicit bounded task.
- No credential value or full `DATABASE_URL` may be printed.
- Stop if the database target cannot be proven disposable.

## Future Bounded Task Candidates

- Schema decision packet.
- Migration proposal file, no apply.
- Disposable DB dry-run, no apply.
- Read-only draft repository implementation against injected DB client.
- Idempotency repository implementation against injected DB client.

## Local Worktree / Git Warning

Task1142 doc remains untracked and unstaged.

`git diff --cached --name-only` must remain empty.

Existing unrelated dirty and untracked stack remains untouched.
