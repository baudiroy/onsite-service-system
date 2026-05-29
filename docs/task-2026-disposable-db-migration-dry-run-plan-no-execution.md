# Task2026 Disposable DB Migration Dry-Run Plan / No Execution

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 22 - Migration and Seed Authorization Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2026-disposable-db-migration-dry-run-plan-no-execution.md`
- Current local baseline before this task: Task2025 committed as `bfd4d7a`.
- This task is a no-execution plan only.
- No Docker service was started.
- No DB connection was opened.
- No migration dry-run was run.
- No migration was applied.
- No seed was run.
- No `DATABASE_URL` value or secret was printed.

## Purpose

This plan defines the safety envelope for a future disposable local/test DB migration dry-run. It does not authorize execution.

The safest first execution class remains:

- disposable local/test PostgreSQL DB only,
- no shared DB,
- no staging DB,
- no production DB,
- no Zeabur production/shared DB,
- no real customer, organization, provider, billing, or production operational data.

## Dry-Run Is Not Apply / Seed / Smoke

- Dry-run is not migration apply.
- Dry-run is not seed.
- Dry-run is not smoke.
- Dry-run is not runtime start.
- Dry-run is not deploy.
- Dry-run is not approval to inspect Zeabur env values.
- Dry-run is not approval to execute provider, billing, or AI calls.

## Future Approval Phrase

A future dry-run task must not start without an explicit approval phrase substantially equivalent to:

```text
I approve a disposable local/test DB dry-run for migration range <MIGRATION_RANGE> against the explicitly named target: <DB_TARGET_NAME>. Do not use shared, staging, Zeabur production, or production DB. Do not print DATABASE_URL or secrets. Do not run seed, smoke, deploy, provider, billing, or AI execution.
```

The approval must include:

- the exact target name,
- the exact migration range,
- disposable local/test DB scope,
- no secret printing,
- no shared/staging/production DB,
- no seed,
- no smoke,
- no deploy.

Generic wording such as `continue`, `go ahead`, `run migration`, `approved`, `please proceed`, or `請繼續` is not sufficient.

## Command Envelope Examples

The following examples are placeholders only and must not be run from this document:

```bash
DATABASE_URL=<DISPOSABLE_LOCAL_TEST_DB_URL> npm run db:migrate -- --dry-run
```

```bash
DATABASE_URL=<DISPOSABLE_LOCAL_TEST_DB_URL> <APPROVED_DRY_RUN_COMMAND> --migration-range <MIGRATION_RANGE> --dry-run
```

Rules for any future command:

- real DB URLs must never be written into docs, chat, commits, screenshots, terminal transcript, or PM reports,
- command output must be sanitized before reporting,
- no seed command may be chained,
- no smoke command may be chained,
- no deploy/restart command may be chained.

## Migration Range Decision Process

Before any future dry-run, the task must decide and record one of:

| Range option | When appropriate | Extra approval needed |
| --- | --- | --- |
| Single migration `023` only | Engineer Mobile visit-action persistence rehearsal after Task1864 evidence needs fresh confirmation | Explicit target and migration `023` dry-run approval |
| Single migration `026` only | Repair Intake persistence rehearsal after PM scopes Repair Intake DB readiness | Explicit target and migration `026` dry-run approval |
| Sequential pending range such as `020-026` | Disposable DB is freshly created and PM wants full current file-order rehearsal | Explicit range approval and stop plan |
| Incremental unknown-target range | Not safe without applied-state inspection | Must stop; applied-state cannot be inferred without approved DB target |

Task2026 does not choose an execution range. It only defines how a future task must choose one after PM approval.

## Preconditions For Future Dry-Run

- Target is disposable local/test and explicitly named.
- Target contains no shared/staging/production/customer/provider/billing data.
- Migration range is explicitly named.
- Operator confirms no real `DATABASE_URL` value will be printed.
- Migration command is isolated from seed, smoke, deploy, and runtime start.
- Expected output format is sanitized.
- Stop conditions are accepted before execution.

## Stop Conditions

Stop before or during a future dry-run if:

- target name is missing,
- target class is ambiguous,
- target appears shared, staging, Zeabur production, production, or persistent customer/org data,
- migration range is missing or unclear,
- command would apply instead of dry-run,
- command would run seed,
- command would run smoke or endpoint probes,
- command would start runtime,
- command would deploy, redeploy, restart, or rollback,
- command would inspect or print Zeabur env values,
- command would print `DATABASE_URL`, credentials, tokens, private keys, passwords, or provider secrets,
- output includes raw DB rows, customer data, raw SQL error details beyond sanitized class, stack traces, provider payloads, billing data, AI output, or live operational data,
- destructive SQL appears outside the explicitly approved migration range,
- migration ordering or applied state is inconsistent.

## Rollback / Cleanup Expectation

For disposable local/test dry-run only:

- prefer a transaction or disposable database lifecycle that can be discarded,
- if a transaction wrapper is used, it must be rolled back before the task is considered complete,
- if a disposable database/container is used, cleanup must be documented by non-secret target label only,
- cleanup failure must stop the task and report sanitized state,
- rollback/cleanup does not authorize manual SQL repair, production cleanup, shared DB cleanup, or seed.

## Sanitized Output Requirements

A future dry-run report may include:

- target label only,
- target class,
- migration range,
- high-level PASS/FAIL,
- migration filenames attempted,
- sanitized error class,
- confirmation that secrets were not printed,
- confirmation that seed/smoke/deploy/provider/billing/AI did not run.

It must not include:

- real `DATABASE_URL`,
- credentials,
- tokens,
- passwords,
- private keys,
- Zeabur secrets,
- raw DB rows,
- live customer/org/provider/billing data,
- raw SQL output containing sensitive values,
- stack traces with environment data.

## Recommended Future Sequence

1. PM/user provides exact dry-run approval phrase.
2. Confirm target label and disposable local/test classification.
3. Confirm migration range.
4. Confirm no seed, smoke, deploy, Zeabur env inspection, provider, billing, or AI execution.
5. Execute only in the future approved task.
6. Report sanitized PASS/FAIL only.
7. Stop before any apply or seed decision.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified.
- No Docker service was started.
- No DB connection, SQL, `psql`, migration dry-run, migration apply, or seed was run.
- No smoke, endpoint probe, or `/healthz` call was run.
- No Zeabur env value was inspected or changed.
- No deploy, redeploy, restart, or rollback was performed.
- No provider, billing, or AI execution was performed.
- No secrets were printed.
- No `finalAppointmentId`, Completion Report / FSR, or customer-visible publication behavior was touched.
- The 7 held historical untracked docs were not touched.
