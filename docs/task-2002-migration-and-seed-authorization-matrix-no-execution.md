# Task 2002 - Migration and Seed Authorization Matrix / No Execution

## Scope

Task2002 defines how future migration and seed work must be authorized before
any DB command can run.

This document is planning-only. It is not authorization to connect to a
database, run SQL, run psql, run migrations, run seed, run smoke, start runtime,
deploy, probe Zeabur, execute providers, execute billing or payment behavior,
execute AI/RAG providers, publish customer-visible data, or mutate runtime
state.

## Purpose

- Define how migration and seed actions are authorized before any DB command can
  run.
- Prevent generic "continue", "next", "run it", or similar instructions from
  triggering migrations, seed, DB-backed smoke, destructive cleanup, provider
  sending, billing, payment, AI/RAG, or customer-visible publication.
- Keep future DB work tied to an exact target, exact operation, explicit
  forbidden actions, and sanitized PASS/FAIL reporting.
- Preserve existing migration and seed gates until PM/user approval names the
  exact migration, seed, target, and scope.

## DB Target Categories

| DB target category | Description | Default posture |
| --- | --- | --- |
| No DB / synthetic only | Unit, contract, and static checks using injected fake clients only. | Allowed when the task is explicitly no-DB. |
| Disposable local/test PostgreSQL | Throwaway PostgreSQL target used only for bounded dry-run or verification. | Requires disposable target approval. |
| Local persistent dev DB | Developer machine database that may retain state across runs. | Requires exact named target approval. |
| Zeabur test DB | Approved non-production Zeabur PostgreSQL target. | Requires exact named target approval and no secrets printed. |
| Zeabur shared/staging DB | Shared or staging Zeabur database. | Requires high-safety explicit approval. |
| Zeabur production DB | Production Zeabur database. | Requires production-level explicit approval. |
| External managed DB | Any non-Zeabur managed database. | Requires exact named target and owner approval. |

## Operation Categories

| Operation category | Description | Default posture |
| --- | --- | --- |
| Migration readiness inspection | Reads repository files and migration docs without DB connection. | Allowed without DB connection. |
| Migration dry-run in transaction | Runs migration in rollback-only or disposable context. | Requires disposable or exact target approval. |
| Migration apply | Applies migration changes to a DB target. | Requires exact named target approval. |
| Seed readiness inspection | Reads seed scripts and docs without DB connection. | Allowed without DB connection. |
| Seed dry-run if supported | Exercises seed logic without durable target mutation. | Requires exact target and dry-run semantics approval. |
| Seed apply | Inserts or updates seed/admin/bootstrap data. | Requires exact named target and seed-data approval. |
| Rollback verification | Verifies rollback or down-migration expectations. | Requires exact target approval. |
| Schema diff inspection | Compares expected schema to code or migration files. | Allowed without DB only; DB-backed diff requires target approval. |
| Destructive fixture cleanup | Deletes fixtures or test data. | Forbidden unless future task explicitly scopes it. |
| Production data correction | Alters real production/shared data. | Forbidden unless future production-level task explicitly scopes it. |

## Authorization Matrix

Classification keys:

- `N`: allowed without DB connection.
- `L`: requires disposable local/test target approval.
- `T`: requires exact named target approval.
- `P`: requires production-level approval.
- `F`: forbidden for now.

| DB target category | Readiness inspection | Migration dry-run | Migration apply | Seed inspection | Seed dry-run | Seed apply | Rollback verification | Schema diff | Destructive cleanup | Production correction |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| No DB / synthetic only | N | F | F | N | F | F | F | N | F | F |
| Disposable local/test PostgreSQL | N | L | F | N | L | F | L | L | F | F |
| Local persistent dev DB | N | T | T | N | T | T | T | T | F | F |
| Zeabur test DB | N | T | T | N | T | T | T | T | F | F |
| Zeabur shared/staging DB | N | T | P | N | T | P | P | T | F | F |
| Zeabur production DB | N | P | P | N | P | P | P | P | F | F |
| External managed DB | N | T | T | N | T | T | T | T | F | F |

## Conservative Defaults

- Readiness inspection is allowed only when it does not connect to a DB.
- Disposable local/test dry-run can be allowed with an exact approval phrase
  naming the disposable target and rollback expectations.
- Zeabur test DB work requires exact target approval and no secrets printed.
- Shared, staging, and production DB apply operations require separate
  high-safety authorization.
- Destructive cleanup and production data correction are forbidden unless a
  future task explicitly scopes target, data set, rollback expectations, and
  approval authority.
- No DATABASE_URL value may be printed, copied into docs, copied into PM
  reports, or stored in commits.

## Migration And Seed Approval Phrase Templates

Use these as templates only. Replace bracketed placeholders before future
execution. A generic continuation instruction is not enough.

### Migration Dry-run Against Disposable Local/Test DB

I approve migration dry-run for `[exact migration id or file]` against
`[exact disposable local/test DB target name]` only. Use rollback-only or
disposable behavior. Do not print DATABASE_URL or secrets. Do not apply to
shared, staging, or production DB. Do not run seed. Do not run smoke. Do not
trigger providers, billing, payment, AI/RAG, or customer-visible publication.
Report sanitized PASS/FAIL only.

### Migration Apply Against Named Zeabur Test DB

I approve applying `[exact migration id or file]` to `[exact Zeabur test DB
target name]` only. Do not print DATABASE_URL or secrets. Do not run seed unless
separately approved. Do not run smoke unless separately approved. Do not trigger
providers, billing, payment, AI/RAG, or customer-visible publication. Report
sanitized PASS/FAIL and final migration state only.

### Seed Apply Against Named Target

I approve seed apply for `[exact seed script or seed scope]` against
`[exact DB target name]` only. Allowed seed data is `[exact seed data scope]`.
Do not print DATABASE_URL, passwords, JWT secrets, provider keys, or tokens. Do
not run migrations unless separately approved. Do not run smoke unless
separately approved. Do not trigger providers, billing, payment, AI/RAG, or
customer-visible publication. Report sanitized PASS/FAIL only.

### Production Or Shared DB Operation

I approve `[exact operation]` for `[exact migration/seed/data correction scope]`
against `[exact production/shared DB target name]` only. Do not print
DATABASE_URL or secrets. Do not trigger providers, billing, payment, AI/RAG, or
customer-visible publication. Use the approved rollback and communication plan:
`[exact rollback/communication plan]`. Report sanitized PASS/FAIL only.

## Required Phrase Elements

Every DB/migration/seed approval phrase must include:

- Exact target name.
- Exact migration, seed, or operation scope.
- No DATABASE_URL printing.
- No secrets printing.
- No provider sending.
- No billing, payment, invoice, or payment-method behavior.
- No AI/RAG provider execution.
- No customer-visible publication unless separately and explicitly approved.
- Sanitized PASS/FAIL output only.

## Existing Migration And Seed Gates

The following gates remain active:

- Task1869 migration 023 apply remains gated.
- Task1871 Engineer Mobile DB-backed smoke remains gated.
- Future repair intake DB-backed verification remains gated.
- Future admin dispatch DB-backed verification remains gated.
- Future depot workshop DB-backed verification remains gated.
- Future SaaS DB-backed verification remains gated.

Approval for one DB target, migration, seed, or smoke gate must not be reused for
another gate.

## Stop Conditions

Stop immediately and report if any of the following occurs or appears likely:

- DATABASE_URL would be printed.
- Any secret would be printed.
- DB target is ambiguous.
- Production/shared target is not explicitly approved.
- Migration order is unclear.
- Seed data scope is unclear.
- Destructive operation is detected.
- Provider sending would be triggered.
- Billing, payment, invoice, or payment-method behavior would be triggered.
- AI/RAG provider execution would be triggered.
- Customer-visible publication would be triggered.
- Rollback expectations are unclear.
- Organization isolation risk is detected.

## Non-authorization Statement

This matrix is not authorization to run migration or seed.

Each future DB task must name the exact migration, seed, target, operation
scope, forbidden actions, and reporting expectations, and must have explicit
PM/user approval before DB execution.

## Explicit Non-goals

Task2002 does not:

- Modify runtime source.
- Modify tests.
- Modify package or lockfiles.
- Modify admin frontend.
- Connect to any DB.
- Run DB, SQL, psql, migration, seed, runtime, smoke, deploy, Zeabur, provider,
  billing, payment, invoice, or AI/RAG commands.
- Probe Zeabur public endpoints.
- Print DATABASE_URL, JWT_SECRET, tokens, private keys, provider keys,
  passwords, LINE secrets, billing provider secrets, Zeabur secrets, or
  passphrases.
- Mutate `finalAppointmentId`.
- Create, approve, publish, revoke, or mutate Completion Report / Field Service
  Report behavior.
- Create customer-visible publication behavior.
- Bypass organization isolation.
