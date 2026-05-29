# Task2028 Migration Apply Authorization Packet / No Execution

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 22 - Migration and Seed Authorization Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2028-migration-apply-authorization-packet-no-execution.md`
- Current local baseline before this task: Task2027 committed as `1bb68d2`.
- This task is an authorization packet only.
- No DB connection was opened.
- No migration was run.
- No migration dry-run was run.
- No seed was run.
- No `DATABASE_URL` value or secret was printed.

## Core Rule

Generic instructions are not migration authorization.

The following are not enough:

- `continue`
- `go ahead`
- `approved`
- `run migration`
- `do the next task`
- `please proceed`
- `可以`
- `繼續`
- `請繼續`

Any future migration dry-run or apply task must name the target and migration range exactly.

## Required Approval Phrases

### Disposable DB Dry-Run

```text
I approve a disposable local/test DB dry-run for migration range <MIGRATION_RANGE> against the explicitly named target: <DB_TARGET_NAME>. Do not use shared, staging, Zeabur production, or production DB. Do not print DATABASE_URL or secrets. Do not run seed, smoke, deploy, provider, billing, or AI execution.
```

This authorizes dry-run only. It does not authorize apply, seed, smoke, endpoint probes, deploy, Zeabur env inspection, provider calls, billing calls, or AI calls.

### Approved Test DB Migration Apply

```text
I approve applying migration range <MIGRATION_RANGE> to the explicitly named test DB target: <DB_TARGET_NAME>. Do not use any other DB. Do not print DATABASE_URL or secrets. Do not run seed, smoke, deploy, provider, billing, or AI execution.
```

This authorizes only the named migration range on the named test DB target.

### Shared / Staging DB Migration Apply

```text
I approve applying migration range <MIGRATION_RANGE> to the explicitly named shared/staging DB target: <DB_TARGET_NAME>, with incremental order, backup/rollback expectation, customer impact boundary, and stop conditions confirmed. Do not use any other DB. Do not print DATABASE_URL or secrets. Do not run seed, smoke, deploy, provider, billing, or AI execution.
```

This requires stronger review than disposable/test DB. It must not be inferred from a test DB approval.

### Production DB Migration Apply

```text
I approve applying migration range <MIGRATION_RANGE> to the explicitly named production DB target: <DB_TARGET_NAME>, with production change gate, backup/rollback plan, maintenance/customer impact boundary, operator approval, and stop conditions confirmed. Do not use any other DB. Do not print DATABASE_URL or secrets. Do not run seed, smoke, deploy, provider, billing, or AI execution.
```

Production apply is forbidden by default and must remain outside generic runtime continuation.

## Required Inputs Before Any Future Apply

| Input | Required | Notes |
| --- | --- | --- |
| Target name | Yes | Must be a non-secret label, not a connection string |
| Target class | Yes | Disposable/test/shared/staging/production/external |
| Migration range | Yes | Must list exact number or range, such as `023` or `020-026` |
| Applied-state pre-check scope | Yes | Must be explicitly approved if DB inspection is needed |
| No-secret handling | Yes | Never print DB URL, credentials, tokens, passwords, private keys, or Zeabur secrets |
| Seed decision | Yes | Must be `no seed` unless a separate seed task is approved |
| Smoke decision | Yes | Must be `no smoke` unless a separate smoke task is approved |
| Rollback/stop policy | Yes | Must stop on ambiguity; no improvised manual SQL |

## Pre-Check Requirements

A future apply task must pre-check only what the approval permits. At minimum, before migration execution it must confirm:

- branch and commit,
- no tracked dirty changes outside the approved task,
- migration file(s) exist in the approved range,
- migration order is clear,
- target label and class are explicit,
- `DATABASE_URL` or equivalent connection reference is available without printing its value,
- command does not include seed,
- command does not include smoke,
- command does not include deploy/restart/rollback,
- command does not include provider, billing, or AI execution.

If applied-state inspection is required, it must be named in the same task approval and must report only sanitized migration identifiers and status. It must not print connection strings, credentials, row data, or secret-bearing env values.

## Stop Conditions

Stop before execution if:

- target is unnamed,
- target class is ambiguous,
- migration range is missing,
- command would use a different DB,
- command would print or expose a secret,
- command would run seed in the same task,
- command would run smoke or endpoint probes,
- command would call `/healthz`,
- command would deploy, redeploy, restart, or rollback,
- command would inspect or modify Zeabur env values,
- command would execute provider, billing, or AI behavior,
- package or lockfile changes appear necessary,
- runtime source changes appear necessary,
- Completion Report / FSR behavior would be created or changed,
- `finalAppointmentId` would be selected, inferred, exposed, or mutated,
- customer-visible publication behavior would be created.

Stop during execution if:

- migration tool reports unexpected applied-state,
- migration order differs from approved range,
- SQL outside the approved migration range appears,
- any output includes secrets, raw DB rows, customer/org/provider/billing data, stack traces with env data, provider payloads, or AI output,
- partial/uncertain apply state is detected,
- seed, smoke, deploy, provider, billing, or AI behavior starts unexpectedly.

## Rollback Boundary

This packet does not authorize rollback execution.

If a future apply fails:

- stop,
- preserve sanitized failure class,
- do not improvise manual SQL,
- do not retry against another target,
- do not run seed,
- do not run smoke,
- do not deploy or restart,
- request a separate rollback/recovery task that names the same target and permitted recovery action.

## Post-Apply Verification Requirements

A future apply completion report must include only sanitized, non-secret data:

- target label,
- target class,
- migration range,
- migration filenames,
- high-level applied/pending result,
- whether seed was not run,
- whether smoke was not run,
- whether deploy/restart/rollback was not run,
- whether provider/billing/AI did not run,
- whether no secrets were printed,
- whether no Completion Report / FSR behavior was touched,
- whether `finalAppointmentId` was untouched,
- whether no customer-visible publication behavior was created,
- final git status.

It must not include:

- real `DATABASE_URL`,
- credentials,
- passwords,
- tokens,
- private keys,
- Zeabur secrets,
- provider keys,
- raw DB rows,
- customer records,
- raw SQL output containing sensitive values,
- stack traces with environment data.

## Explicit Gates

| Gate | Current status | Required future approval |
| --- | --- | --- |
| Task1869 migration 023 apply | Still gated | Approval must name migration `023`, target name, target class, no-secret handling, no seed, and no smoke |
| Future Task2034 approved test DB migration apply | Not executed in this task | Approval must name the test DB target and exact migration range; generic continuation is insufficient |

## Seed Separation

Seed must not run in the same task as migration apply.

A future seed task requires:

- target name,
- seed purpose,
- explicit statement that migration apply is already complete or not part of the task,
- bootstrap password or secret generation outside Codex,
- no secret printing,
- sanitized completion report.

## Recommendation

Use this packet as the authorization boundary before any migration apply discussion. Proceed to Task2029 only if PM accepts this packet and separately assigns the next batch. Do not execute DB, SQL, migration, seed, smoke, endpoint probes, deploy, provider, billing, or AI from Task2028.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified.
- No DB connection, SQL, `psql`, migration dry-run, migration apply, or seed was run.
- No smoke, endpoint probe, or `/healthz` call was run.
- No Zeabur env value was inspected or changed.
- No deploy, redeploy, restart, or rollback was performed.
- No provider, billing, or AI execution was performed.
- No secrets were printed.
- No `finalAppointmentId`, Completion Report / FSR, or customer-visible publication behavior was touched.
- The 7 held historical untracked docs were not touched.
