# Task1867 Migration 023 Apply Authorization Packet / No Execution

## Status

Task1867 is an authorization packet only.

This task does not connect to a database, execute SQL, run `psql`, run `npm run db:migrate`, run a migration dry-run, apply migration 023, run seed, run runtime smoke, touch Zeabur settings, deploy, or print secrets.

## Current Baseline

- `origin/main` baseline at batch start: `a01fddcacf6ba84668532800f352622105626ac6`.
- Task1865P, Task1877P, Task1865, and Task1866 are committed and pushed.
- Task1865 implemented the Engineer Mobile visit action SQL repository adapter with injected `dbClient` only.
- Task1866 hardened the SQL repository contract and boundary tests.
- Migration file present in the current repository: `migrations/023_engineer_mobile_visit_action_persistence_fields.sql`.
- Task1838 created the migration 023 draft only and did not execute it.
- Task1840 created the disposable local/test DB dry-run authorization packet only and did not execute it.
- PM-provided runtime packet baseline records Task1864 migration 023 disposable local/test Docker PostgreSQL dry-run as PASS.
- Task1864 dry-run evidence was not re-run in Task1867.
- Migration 023 has not been applied to Zeabur, shared, staging, or production DB in this batch.
- No seed has been run.
- No provider sending is authorized.

## Scope Of A Future Migration 023 Apply

A future apply task may only apply this exact migration:

- `migrations/023_engineer_mobile_visit_action_persistence_fields.sql`

No other migration, seed, runtime smoke, fixture, provider call, Zeabur env mutation, deploy, Completion Report / Field Service Report behavior, `finalAppointmentId` behavior, or customer-visible publication behavior is included.

## Exact Target Requirement

Before any future Task1869 migration apply can start, the target must be explicitly named and classified as one of:

- disposable local/test PostgreSQL database, or
- explicitly named Zeabur test DB / approved environment.

The target name must be human-readable and non-secret. A real connection string, password, token, private key, Zeabur secret, or `DATABASE_URL` value must not be pasted into chat, docs, commits, logs, screenshots, or terminal output.

## Forbidden Targets

The following targets are forbidden for migration 023 apply:

- production DB,
- shared DB,
- ambiguous Zeabur DB,
- unknown Zeabur PostgreSQL service,
- any DB selected from generic wording such as "continue", "go ahead", "approved", "next", "run it", "do it", or "please proceed",
- any target whose ownership, environment, or disposal policy is unclear,
- any target that may contain live customer, organization, billing, provider, or production operational data unless separately approved as an explicitly named migration target by PM and user.

## Required Approval Phrase

Task1869 or any future migration 023 apply must not run unless the user provides an explicit approval phrase substantially equivalent to:

```text
I approve applying migration 023 to the explicitly named target: <TARGET_NAME>. Do not use any other DB. Do not print DATABASE_URL or secrets. Do not run seed or runtime smoke.
```

The approval must include:

- the exact migration number: `023`,
- the exact named target,
- instruction not to use any other DB,
- instruction not to print `DATABASE_URL` or secrets,
- instruction not to run seed,
- instruction not to run runtime smoke.

Generic approval is insufficient.

## Secret Handling Rules

- Never print `DATABASE_URL`.
- Never print DB credentials.
- Never print Zeabur secrets.
- Never print passwords, tokens, private keys, passphrases, provider keys, JWT secrets, or connection strings.
- Use redacted labels only, such as `approved target present`, `connection reference present`, or `target unclear`.
- Sanitized output may include PASS/FAIL and non-secret target names only.

## Out Of Scope For The Apply Gate

The future apply gate must not include:

- `npm run db:seed`,
- any seed command,
- runtime smoke,
- fixture smoke,
- destructive cleanup,
- provider sending through LINE / SMS / Email / App / webhook,
- OpenAI / RAG / vector work,
- billing or settlement provider work,
- Zeabur deploy,
- Zeabur env var edits,
- package or lockfile changes,
- admin frontend changes,
- Completion Report / Field Service Report creation or publication,
- `finalAppointmentId` mutation,
- customer-visible publication behavior.

## Stop Conditions Before Execution

Stop before any DB-adjacent command if:

- the explicit approval phrase is missing,
- the target is not named,
- the target name is ambiguous,
- the target classification is unknown,
- the target appears to be production, shared, staging, or live customer/org data,
- the requested migration is not exactly migration 023,
- the command would run more than migration 023,
- the command would run seed or smoke,
- the command would print or expose a secret,
- Zeabur env values would need to be viewed or modified,
- provider sending would be enabled,
- Completion Report / Field Service Report behavior would be created or published,
- `finalAppointmentId` would be selected, inferred, exposed, or mutated,
- customer-visible publication behavior would be created,
- organization isolation would be bypassed,
- any migration ordering or applied-state uncertainty cannot be resolved without DB inspection that is outside the approved task.

## Stop Conditions During A Future Apply

If a future apply is explicitly approved, stop immediately and report sanitized PASS/FAIL only if:

- the migration tool reports a connection target mismatch,
- the migration tool attempts a different migration,
- the migration tool would run seed,
- the migration tool would run runtime code or smoke,
- the migration tool prints credentials,
- any SQL outside migration 023 appears,
- any error suggests partial or uncertain apply state,
- any output includes live customer/org/provider/billing data.

## Rollback Boundary

Task1867 does not authorize rollback execution.

If a future apply fails or leaves uncertainty, do not improvise rollback, manual SQL, cleanup, seed, smoke, or retries. Stop and request a separate rollback or recovery task that names the same target, includes sanitized failure evidence, and explicitly states whether rollback SQL is allowed.

## Apply Result Reporting Requirements

A future apply report must include only:

- target label, without credentials,
- migration number,
- sanitized PASS/FAIL,
- whether seed was not run,
- whether smoke was not run,
- whether provider sending remained disabled,
- whether no secrets were printed,
- whether no Completion Report / FSR behavior was created,
- whether `finalAppointmentId` remained untouched,
- whether no customer-visible publication behavior was created.

## Task1867 Verification

Task1867 verification is limited to repository status and static project checks.

No DB connection, SQL, migration dry-run, migration apply, seed, Zeabur env inspection, deploy, runtime start, or smoke is authorized by this document.
