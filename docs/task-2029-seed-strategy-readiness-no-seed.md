# Task2029 Seed Strategy Readiness / No Seed

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 22 - Migration and Seed Authorization Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2029-seed-strategy-readiness-no-seed.md`
- Current synced baseline before this task: `f3e4f0e71213e1c356b4ae0b99df95a4075fefa3`
- This task is no-seed planning only.
- No DB target has been approved.
- No DB connection, SQL, migration, seed, smoke, endpoint probe, deploy, provider, billing, or AI execution occurred.
- No real `DATABASE_URL`, password, token, private key, provider key, or Zeabur secret was printed.

## Seed Separation Rules

- Seed is separate from migration.
- Seed is separate from smoke.
- Seed requires exact target approval.
- Seed must not run from generic continuation wording.
- Seed output must be sanitized.
- No seed should print passwords, secrets, connection strings, provider credentials, raw DB rows, customer data, or billing data.
- Admin seed password must be generated/provided outside Codex unless a future task explicitly scopes a safe non-chat secret entry flow.
- Seed should never run in the same task as migration apply unless a future PM instruction explicitly creates a combined task with target, migration range, seed purpose, and stop conditions.

## Seed Categories

| Seed category | Purpose | Default status | Required future gate |
| --- | --- | --- | --- |
| Admin seed | Create/update backend admin role, permissions, and admin user | Paused | Exact DB target, admin identity fields by name, password handled outside Codex, no provider sending |
| Regular test user seed | Create a non-admin test user for internal/manual smoke | Paused | Exact DB target and test-user purpose; no production unless explicitly approved |
| Engineer test user seed | Create engineer identity and organization scope for Engineer Mobile smoke | Paused | Exact DB target, org/assignment fixture boundary, no real customer data |
| Customer access seed | Create safe customer-access context for customer-facing route checks | Paused | Exact DB target, fake customer data only, no real phone/address/payment data |
| Fixture seed | Create test organizations/cases/appointments/intake/depot records | Paused | Exact target, fixture class, cleanup expectation, non-destructive scope |
| Production seed | Bootstrap production admin/system data | Forbidden by default | Separate production approval, backup/rollback and customer impact boundary |

## Known Seed Variables By Name

These names exist in repo config or docs and are listed as labels only:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_DISPLAY_NAME`
- `SEED_SMOKE_USER_EMAIL`
- `SEED_SMOKE_USER_PASSWORD`
- `SEED_SMOKE_USER_DISPLAY_NAME`

No values are recorded in this document.

## Target Class Matrix

| Target class | Default seed status | Approval need | Notes |
| --- | --- | --- | --- |
| Disposable local/test DB | Allowed only after exact approval | Target name, seed purpose, no-secret handling, cleanup expectation | Preferred first seed rehearsal target |
| Zeabur test DB | Paused | Zeabur test DB target label, seed purpose, no production/shared data confirmation | Do not inspect env values; user/PM must classify target without secrets |
| Shared/staging DB | Forbidden by default | Stronger explicit target approval, data impact boundary, duplicate-risk handling | Must not be inferred from generic runtime flow |
| Production DB | Forbidden by default | Separate production seed gate with operator approval and customer impact boundary | Never run from generic approval |

## Stop Conditions

Stop before any future seed if:

- target is unclear,
- target class is ambiguous,
- credentials or env values are visible,
- production target is not explicitly named,
- seed purpose is unclear,
- seed would run in the same task as migration apply without explicit combined-task approval,
- destructive fixture data risk exists,
- duplicate admin risk is unresolved,
- user identity or organization scope is ambiguous,
- seed script would send provider notifications,
- seed would create customer-visible publication behavior,
- seed would touch Completion Report / FSR behavior,
- seed would mutate `finalAppointmentId`,
- output would print passwords, secrets, DB URLs, raw DB rows, customer data, provider payloads, billing data, or AI output.

## Sanitized Output Requirements

A future seed report may include:

- target label,
- target class,
- seed category,
- high-level PASS/FAIL,
- created/updated/skipped counts if sanitized,
- non-secret admin email/display labels only if PM approved them for reporting,
- confirmation that passwords and secrets were not printed.

It must not include:

- passwords,
- password hashes,
- `DATABASE_URL` values,
- tokens,
- private keys,
- Zeabur secrets,
- provider keys,
- raw DB rows,
- real customer data,
- real phone/address/payment data.

## Recommendation

Proceed to Task2030 as a no-seed admin seed approval packet. Do not run `npm run db:seed`, do not connect to DB, do not inspect Zeabur env values, and do not create fixtures from Task2029.

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
