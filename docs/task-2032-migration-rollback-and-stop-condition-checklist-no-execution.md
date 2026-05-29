# Task2032 Migration Rollback and Stop-Condition Checklist / No Execution

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 22 - Migration and Seed Authorization Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2032-migration-rollback-and-stop-condition-checklist-no-execution.md`
- Current local baseline before this task: Task2031 committed as `67dd37a`.
- This task is no-execution planning only.
- No rollback was run.
- No backup or restore was run.
- No migration was run.
- No DB connection, SQL, seed, smoke, endpoint probe, deploy, provider, billing, or AI execution occurred.
- No `DATABASE_URL` value or secret was printed.

## Specific Notes

- Rollback plan is not rollback execution.
- Backup plan is not backup execution.
- DB restore is separately gated.
- Never print `DATABASE_URL` or credentials.
- Never proceed if target is unclear.
- Never apply to production from generic approval.

## Pre-Migration Backup / Restore Readiness Questions

Before any future migration apply task, the operator/PM must answer by non-secret target label:

- What is the target name?
- What is the target class: disposable/test/shared/staging/production/external?
- Is this target allowed for migration apply?
- Is the approved migration range exact?
- Is applied-state inspection approved and bounded?
- Is there a backup/restore expectation?
- Who owns backup/restore execution?
- Is rollback automatic, manual, or unavailable?
- What is the stop point if migration state is unexpected?
- Is seed explicitly excluded from this task?
- Is smoke explicitly excluded from this task?
- Are provider/billing/AI executions explicitly excluded?
- Are Completion Report / FSR, `finalAppointmentId`, and customer-visible publication behavior excluded?

If any answer is unclear, stop before DB-adjacent commands.

## Transaction Strategy

Use transaction boundaries when the migration tooling and database support them.

Future migration execution must document:

- whether each migration file is wrapped in a transaction,
- whether any statement cannot run inside a transaction,
- whether partial apply is possible,
- whether the migration tool tracks applied files,
- whether rollback is automatic or requires manual recovery.

Transaction support does not remove the need for target approval, backup/restore planning, or stop conditions.

## Stop Conditions Before Execution

Stop before migration execution if:

- target name is missing,
- target class is ambiguous,
- production/shared/staging target is requested from generic approval,
- migration range is missing or inconsistent,
- applied-state inspection is needed but not approved,
- `DATABASE_URL` or credentials would be printed,
- Zeabur env values would need to be inspected,
- backup/restore expectation is unclear for shared/staging/production,
- command would include seed,
- command would include smoke or endpoint probes,
- command would call `/healthz`,
- command would deploy, redeploy, restart, or rollback,
- command would execute provider, billing, or AI behavior,
- package/lockfile/runtime/admin source changes appear necessary,
- organization isolation or customer data boundary is unclear.

## Stop Conditions During Migration

Stop during a future migration task if:

- command targets a different DB than approved,
- migration tool reports unexpected applied-state,
- SQL outside the approved migration range appears,
- output includes secrets, credentials, env values, raw DB rows, customer data, provider payloads, billing data, AI output, or stack traces with environment data,
- seed starts unexpectedly,
- smoke or endpoint probing starts unexpectedly,
- deploy/restart/rollback starts unexpectedly,
- provider/billing/AI calls start unexpectedly,
- partial or uncertain apply state is detected,
- destructive DDL is broader than expected,
- cross-tenant or production/customer impact is suspected.

## Stop Conditions After Migration

Stop after a future migration if:

- applied-state verification is inconsistent,
- migration history is dirty or partial,
- any error suggests manual DB repair,
- rollback need is suspected,
- seed is requested immediately without a separate gate,
- smoke is requested immediately without a separate gate,
- output includes secret or sensitive data,
- provider, billing, AI, Completion Report / FSR, `finalAppointmentId`, or customer-visible behavior was triggered unexpectedly.

## Rollback Planning Boundary

Rollback planning may define:

- target label,
- approved migration range,
- known reversible/non-reversible assumptions,
- transaction strategy,
- backup/restore owner,
- stop point,
- reporting format.

Rollback planning must not:

- execute rollback SQL,
- restore a DB,
- delete data,
- run cleanup,
- retry migration,
- switch targets,
- seed,
- smoke,
- deploy or restart.

Any rollback or restore execution requires a separate exact approval naming target, action, and allowed commands.

## Post-Failure Reporting Requirements

A future failure report must include only sanitized information:

- target label,
- target class,
- migration range,
- migration filename,
- high-level failure phase,
- sanitized error class,
- whether partial/uncertain apply state is suspected,
- whether seed/smoke/deploy/provider/billing/AI did not run,
- whether no secrets were printed,
- recommended next gate.

It must not include:

- `DATABASE_URL` value,
- credentials,
- passwords,
- tokens,
- private keys,
- Zeabur secrets,
- provider keys,
- raw DB rows,
- live customer/org/provider/billing data,
- raw stack traces with environment details.

## Recommendation

Stop after Task2032 and report Task2029 through Task2032 for PM review. Do not start Task2033. Task2033 requires separate explicit disposable DB target approval if it is to execute anything DB-adjacent.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified.
- No rollback, backup, or restore was run.
- No DB connection, SQL, `psql`, migration dry-run, migration apply, or seed was run.
- No smoke, endpoint probe, or `/healthz` call was run.
- No Zeabur env value was inspected or changed.
- No deploy, redeploy, restart, or rollback was performed.
- No provider, billing, or AI execution was performed.
- No secrets were printed.
- No `finalAppointmentId`, Completion Report / FSR, or customer-visible publication behavior was touched.
- The 7 held historical untracked docs were not touched.
