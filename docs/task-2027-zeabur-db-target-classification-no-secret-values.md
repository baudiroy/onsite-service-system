# Task2027 Zeabur DB Target Classification / No Secret Values

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 22 - Migration and Seed Authorization Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2027-zeabur-db-target-classification-no-secret-values.md`
- Current local baseline before this task: Task2026 committed as `45f793c`.
- Known Zeabur service label from prior non-secret workflow: `onsite_service`.
- This task is classification-only.
- Zeabur UI was not opened.
- Zeabur env values were not inspected.
- No DB connection was opened.
- No `DATABASE_URL` value or secret was printed.

## Classification Rule

If a Zeabur DB target cannot be classified without viewing secret values, stop and ask the user/PM for non-secret classification. Do not inspect values.

Acceptable non-secret classification inputs include:

- service/project label,
- DB target label,
- environment label such as disposable, test, shared, staging, or production,
- user/PM statement that the target is safe for a specific action.

Unacceptable inputs include:

- pasted connection strings,
- visible `DATABASE_URL` values,
- passwords,
- Zeabur secrets,
- screenshots or logs showing secret-bearing values.

## DB Target Classification Matrix

| Target class | Allowed / forbidden by default | Required user confirmation | Suitable for migration apply | Suitable for seed | Suitable for smoke | Required no-secret handling |
| --- | --- | --- | --- | --- | --- | --- |
| No target named | Forbidden | User/PM must name a non-secret DB target label and target class | No | No | No | Stop immediately; do not infer from `onsite_service`, current branch, or generic continuation |
| Zeabur test DB | Paused until exactly named | User/PM must name the Zeabur test DB target and confirm it is not shared/prod and has no live customer data | Possible only after explicit migration apply approval naming target and migration range | Separate seed approval required; not same task as migration apply | Separate smoke approval required; target URL and data boundary required | Report target label only; never print env values or DB URL |
| Zeabur shared/staging DB | Forbidden by default | Strong explicit approval naming shared/staging target, backup/rollback expectation, incremental migration order, and stop conditions | Possible only under stricter shared/staging change gate | Forbidden unless separately approved with data impact boundary | Possible only after separate exact smoke approval and non-destructive scope | Use target class and label only; stop if classification requires secret viewing |
| Production DB | Forbidden by default | Separate production change gate naming target, migration range, backup/rollback plan, maintenance/customer impact boundary, and operator approval | Not suitable from generic runtime flow; only possible under exact production gate | Not suitable by default; requires separate production seed gate if ever allowed | Not suitable by default; requires separate production smoke gate and no destructive actions | Never print values; sanitized result only; stop on ambiguity |
| External DB | Forbidden until classified | User/PM must name provider/environment/classification and confirm ownership, disposal policy, and customer-data status | Possible only if explicitly named and classified as disposable/test or otherwise approved | Separate seed approval required | Separate smoke approval required | Do not request or print credentials; use non-secret label only |

## Known Service Handling

`onsite_service` is a Zeabur service label, not a DB target by itself.

This task must not infer:

- which PostgreSQL service backs it,
- whether the backing DB is test/shared/staging/production,
- whether migration 023 or any later migration has been applied,
- whether seed has been run,
- whether DB-backed smoke is safe.

Those facts require either non-secret user/PM confirmation or a separately approved DB-target inspection task.

## Action Suitability Summary

| Action | Default state | Required gate |
| --- | --- | --- |
| Migration dry-run | Paused | Disposable local/test or explicitly named safe target; dry-run-only approval |
| Migration apply | Paused/forbidden until target named | Exact target, migration range, no-secret handling, stop conditions |
| Seed | Separate paused gate | Exact target, seed purpose, bootstrap secret handling outside Codex |
| DB-backed smoke | Separate paused gate | Exact target URL, DB target class, fixture/data boundary, auth/identity rules |
| Public safe-deny smoke | Already consolidated through Task2024 | Future probes still require exact endpoint approval |

## Stop Conditions

Stop if:

- target is unnamed,
- target class is unclear,
- target seems shared/staging/production but approval is only generic,
- user asks to inspect or paste secret values,
- Zeabur env UI would need to be opened to view values,
- migration apply and seed are bundled into one task,
- smoke is bundled with migration or seed,
- target ownership or disposal policy is unclear,
- any output would reveal `DATABASE_URL`, credentials, tokens, passwords, private keys, Zeabur secrets, provider keys, raw DB rows, customer data, provider payloads, billing data, or AI output.

## Recommendation

Proceed to Task2028 as a no-execution migration apply authorization packet. Do not classify `onsite_service` as a DB target unless user/PM later provides a non-secret DB target label and target class.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified.
- Zeabur UI was not opened for env inspection.
- No Zeabur env value was inspected or changed.
- No DB connection, SQL, `psql`, migration dry-run, migration apply, or seed was run.
- No smoke, endpoint probe, or `/healthz` call was run.
- No deploy, redeploy, restart, or rollback was performed.
- No provider, billing, or AI execution was performed.
- No secrets were printed.
- No `finalAppointmentId`, Completion Report / FSR, or customer-visible publication behavior was touched.
- The 7 held historical untracked docs were not touched.
