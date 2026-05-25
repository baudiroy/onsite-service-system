# Task1098 - Repair Intake DB / Migration Authorization Packet / No Runtime Change

## Status

Completed locally. Not staged.

## Purpose

This document is a docs-only authorization packet for possible future Repair Intake persistence work.

This task is not DB authorization.

This task is not migration authorization.

This task is not repository implementation authorization.

## Current Accepted State

Task989 through Task1097 were accepted by PM.

The Repair Intake runtime and repository contracts exist only as synthetic or injected seams.

The current accepted state still has:

- No real DB.
- No migration.
- No SQL.
- No psql.
- No db:migrate.
- No real repository writer.
- No transaction boundary.
- No global route mount.
- No production route registration.
- No listen/server startup.
- No API shape or OpenAPI expansion.

## Potential Future DB Scope

The following are candidate future scope only:

- repair intake draft read persistence
- case creation persistence
- idempotency persistence
- audit persistence

None of these candidate areas are authorized by this packet.

No table, migration, repository writer, route mount, or runtime DB connection may be inferred from this document.

## Authorization Requirements Before DB Work

Before any future DB, migration, or repository persistence work, a separate bounded task must include:

- explicit user approval for DB work
- target environment limited to disposable local or disposable test only unless separately approved
- exact migration file name or number
- exact allowed files
- exact DB URL handling rule
- explicit rule to never print credentials or full `DATABASE_URL`
- exact rollback plan
- exact dry-run versus apply distinction
- explicit statement that production, staging, and shared DB targets are forbidden unless separately authorized
- verification commands

Generic runtime continuation is not enough.

## Required Technical Decisions Before Migration

Before creating or applying any migration, the project must decide:

- table names
- primary keys
- organization and tenant isolation fields
- idempotency key uniqueness
- audit event persistence shape
- case linkage fields
- duplicate and conflict handling
- transaction boundaries
- retention and PII policy

These decisions must be recorded before any migration file is created.

## Fail-Closed Rules

The DB / migration path fails closed unless a future task explicitly authorizes the exact scope.

The following remain forbidden:

- generic "continue runtime" as DB authorization
- psql
- db:migrate
- migration creation
- migration modification
- migration apply
- DB connection
- printing credentials
- printing full `DATABASE_URL`
- real repository implementation
- repository writer imports
- imports from `src/repositories/**` or `src/db/**`

## Recommended Future Bounded Branches

Recommended safe next branches:

- disposable DB dry-run authorization packet
- schema proposal docs-only
- repository implementation planning packet
- migration file proposal, only after explicit approval

## Local Worktree Warning

Task989 through Task1098 files remain local, uncommitted, and untracked unless staged outside this task.

The existing tracked dirty stack is pre-existing and must not be cleaned, reverted, restaged, reset, or stashed blindly.

`git diff --cached --name-only` must remain empty.

## Boundaries Held

- No production source files modified.
- No tests modified.
- No migrations modified or created.
- No admin changes.
- No package changes.
- No existing docs modified.
- No global route mount.
- No production route registration.
- No listen/server startup.
- No DB, SQL, migration, psql, or db:migrate.
- No migration creation or modification.
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
