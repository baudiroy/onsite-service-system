# Task1095 - Repair Intake Route Mount Authorization Gate / No Runtime Change

## Status

Completed locally. Not staged.

## Current Accepted Baseline

Task989 through Task1094 were accepted by PM.

The Repair Intake runtime + repository-contract branch is closed for the current phase.

The current safe local entrypoint remains:

- `createRepairIntakeSyntheticAppCompositionHarness`

The current branch still has:

- No global app/server/routes wiring.
- No production route registration.
- No listen/server startup.
- No DB.
- No migration.
- No SQL.
- No psql or db:migrate.
- No real repository implementation.
- No repository writer.
- No API shape or OpenAPI expansion.
- No admin changes.
- No provider sending.
- No AI/RAG.
- No billing, settlement, payment, or invoice work.

## Purpose

This document is a route mount authorization gate for any future Repair Intake draft-to-case route mount.

This task is not authorization to mount routes. It is a readiness and decision packet before any future route registration.

## Route Mount Candidates

Candidate base path:

- `/repair-intake`

Candidate plan route:

- `POST /repair-intake/drafts/:draftId/case/plan`

Candidate submit route:

- `POST /repair-intake/drafts/:draftId/case/submit`

These are candidate paths only. They are not registered production routes.

## Required Authorization Before Any Mount

Any future route mount task must receive separate explicit authorization for:

- route mount
- exact target injection point
- app/router file to modify
- auth/session context source
- organization and tenant context source
- permission source
- approval source
- safe-deny and error contract
- repository and DB persistence decision
- smoke or integration test plan
- rollback plan

Generic "continue runtime" is not enough to authorize global route mount.

## Risks / Blocked Items

Current blockers before route mount:

- no real repository implementation
- no repository writer
- no DB schema
- no migration
- no SQL
- no transaction boundary
- no production auth/session/org runtime integration
- no permission runtime source approval
- no API shape or OpenAPI approval
- no provider sending approval
- no AI/RAG approval
- no admin approval
- no billing approval

## Hard Fail-Closed Rule

Future route mount work must fail closed unless all of these are true:

- a future route mount task is separately assigned
- the future task names the exact route file or app injection point
- the future task names allowed source files
- the future task includes rollback instructions
- the future task includes verification commands
- the future task explicitly authorizes production route registration

No global route mount may be inferred from this document.

## Local Worktree Warning

Task989 through Task1095 files remain local and uncommitted unless staged outside this task.

The existing tracked dirty stack is pre-existing and must not be cleaned, reverted, restaged, reset, or stashed blindly.

`git diff --cached --name-only` must remain empty.

## Boundaries Held

- No production source files modified.
- No tests modified.
- No migrations.
- No admin changes.
- No package changes.
- No existing docs modified.
- No global route mount.
- No production route registration.
- No listen/server startup.
- No DB, SQL, migration, psql, or db:migrate.
- No real repository implementation.
- No repository writer.
- No imports from `src/repositories/**` or `src/db/**`.
- No API shape or OpenAPI expansion.
- No provider sending.
- No AI/RAG.
- No billing, settlement, payment, or invoice changes.
- No staging, cleanup, revert, reset, or stash.

## Verification

Required commands:

```bash
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
