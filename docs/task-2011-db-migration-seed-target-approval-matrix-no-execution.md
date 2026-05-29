# Task2011 DB Migration / Seed Target Approval Matrix / No Execution

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 20 - Staged Runtime Authorization and Matrix Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2011-db-migration-seed-target-approval-matrix-no-execution.md`
- This document is no-execution planning only.
- This document does not authorize DB connection, SQL, `psql`, migration, seed, smoke, endpoint probing, deployment, provider sending, billing provider calls, AI/RAG calls, or secrets handling.

## Approval Principles

- DB target must be explicitly named before any DB action.
- `DATABASE_URL` must never be printed in chat, docs, logs, or commit messages.
- Migration and seed must be separate approval gates.
- Seed may not run in the same task as migration apply.
- A disposable/test DB approval does not authorize shared, staging, or production DB actions.
- A migration dry-run approval does not authorize migration apply.
- Any DB-backed smoke remains separate from migration and seed approval.

## DB Migration / Seed Target Approval Matrix

| Target class | Default status | Required explicit approval phrase | Can `DATABASE_URL` be printed? | Seed may run in same task? | Rollback / stop conditions | Sanitized output requirements |
| --- | --- | --- | --- | --- | --- | --- |
| Disposable local/test DB | Allowed only after exact approval for the named disposable/test target | `I approve <MIGRATION_OR_SEED_ACTION> against disposable local/test DB <DB_TARGET_NAME> only. Do not print DATABASE_URL or secrets. Do not touch Zeabur production/shared DB.` | Never | No | Stop if target name is absent, appears shared/prod, connection fails ambiguously, migration order is unclear, destructive SQL is unexpected, or secrets would be exposed | Report target label only, command category, migration ids/status summary, sanitized error class, and no secret values |
| Zeabur test DB | Paused until exact target and environment are named | `I approve <MIGRATION_OR_SEED_ACTION> against Zeabur test DB <DB_TARGET_NAME> only. Do not print DATABASE_URL or secrets. Do not touch production/shared DB.` | Never | No | Stop if Zeabur service/env is ambiguous, DB appears shared/prod, credentials are visible to Codex, migration state is uncertain, or rollback plan is missing | Report service label only, masked/non-secret target class, migration ids/status summary, and sanitized errors only |
| Shared/staging DB | Forbidden by default; allowed only with stronger explicit approval and stop plan | `I approve <MIGRATION_OR_SEED_ACTION> against shared/staging DB <DB_TARGET_NAME> only, with incremental migration order and stop conditions confirmed. Do not print DATABASE_URL or secrets.` | Never | No | Stop on any unexpected migration history, dirty/partial migration state, missing backup/restore decision, destructive DDL surprise, seed ambiguity, or cross-tenant risk | Report approved target label, applied/pending migration identifiers, high-level result, and redacted errors only |
| Production DB | Forbidden by default; requires separate production change gate outside generic runtime continuation | `I approve <MIGRATION_OR_SEED_ACTION> against production DB <DB_TARGET_NAME> only, with production change gate, backup/rollback plan, and maintenance/stop conditions confirmed. Do not print DATABASE_URL or secrets.` | Never | No | Stop unless production gate, backup/rollback plan, migration inventory, exact operator approval, and customer impact window are all explicit; stop on any unexpected state | Report target class only, migration identifiers, sanitized success/failure, and confirmation no secrets were printed |

## Prior Gated Items

| Task | Gate type | Current recommendation |
| --- | --- | --- |
| Task1869 migration 023 apply | Migration apply gate | Keep paused until an exact DB target and migration apply approval are provided. Dry-run approval is not enough. |
| Task1871 Engineer Mobile DB-backed smoke | DB-backed smoke gate | Keep paused until migration/DB target status and exact smoke target are approved separately. |
| Task1894 Repair Intake smoke | DB-backed smoke gate | Keep paused until exact target, fixture/data boundary, and DB target are approved. |
| Task1906 Admin Dispatch smoke | DB-backed smoke gate | Keep paused until exact target, admin identity scope, and DB target are approved. |
| Task1917 Depot Workshop smoke | DB-backed smoke gate | Keep paused until exact target, fixture/data boundary, and DB target are approved. |
| Task1927 SaaS Admin smoke | DB-backed/runtime smoke or readiness gate | Clarify semantics first; if smoke, require exact tenant/admin target and DB target approval. Billing provider remains forbidden. |

## Migration-Specific Guardrails

- Applied migrations must not be edited.
- Shared environments must apply incrementally in known order.
- Paused/inert warnings must be respected.
- Migration apply must not be hidden inside `npm start`, deploy hooks, smoke tasks, or generic continuation instructions.
- Migration apply must not be bundled with seed.
- Migration result reporting must avoid connection strings, credentials, row-level sensitive data, and environment variable values.

## Seed-Specific Guardrails

- Seed requires separate exact approval naming target class and seed purpose.
- Seed admin password or bootstrap credentials must be generated and entered outside Codex; they must not be printed.
- Seed must not run against shared/staging/production unless the approval explicitly names that target and confirms customer/data impact boundaries.
- Seed result reporting must be sanitized and must not reveal passwords, tokens, connection strings, or private user data.

## Recommended Next Step

Stop after Task2011 and report Phase 20 Task2008-Task2011 for PM review. Do not start Task2012 until PM gives the next batch instruction.
