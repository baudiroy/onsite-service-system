# Task2030 Admin Seed Approval Packet / No Seed

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 22 - Migration and Seed Authorization Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2030-admin-seed-approval-packet-no-seed.md`
- Current local baseline before this task: Task2029 committed as `167115e`.
- This task is an approval packet only.
- No seed was run.
- No DB connection, SQL, migration, smoke, endpoint probe, deploy, provider, billing, or AI execution occurred.
- No real password, `DATABASE_URL`, token, private key, provider key, or Zeabur secret was printed.

## Admin Seed Approval Phrase

A future admin seed task must not start without an explicit approval phrase substantially equivalent to:

```text
I approve running admin seed against the explicitly named DB target: <DB_TARGET_NAME>. Do not use any other DB. Do not print DATABASE_URL, admin password, password hash, tokens, or secrets. Do not run migration, smoke, deploy, provider, billing, or AI execution.
```

The approval must include:

- exact DB target name,
- target class,
- admin seed purpose,
- no secret printing,
- no migration in the same task,
- no smoke in the same task,
- no provider sending.

Generic wording is insufficient.

## Admin Identity Handling

| Field | Handling rule |
| --- | --- |
| Admin email | May be provided as a non-secret identity label if PM/user approves reporting it |
| Admin display name | Non-secret label; may be documented if approved |
| Admin password | Must be generated/provided outside Codex or entered through an approved secret-safe flow; never paste into chat/docs/logs |
| Password hash | Must never be printed in chat/docs/logs |
| DB target | Non-secret label only; never a connection string |

The seed script may update an existing seeded admin user if the email already exists. Future execution must account for duplicate admin risk and report only sanitized created/updated/skipped status.

## Account Type Distinctions

| Account/data type | Meaning | Admin seed packet handling |
| --- | --- | --- |
| Seed admin account | Backend admin bootstrap identity with admin role/permissions | Covered by this packet only after exact target approval |
| Regular test user | Non-admin smoke/manual test identity | Separate seed purpose; not automatically covered by admin seed approval |
| Engineer test user | Engineer Mobile authenticated test identity | Separate fixture/seed approval with organization and assignment boundary |
| Customer test access | Customer-facing access context or identity | Separate fixture/seed approval; fake customer data only |
| Billing contact metadata | Billing-related labels or contacts | Not covered by admin seed; no real billing/payment data |

Admin seed approval does not authorize creating engineer fixtures, customer access fixtures, billing contacts, payment methods, provider metadata, or AI/RAG data.

## Production Boundary

Production admin seed is forbidden by default.

It requires a separate production seed phrase that names:

- production DB target label,
- operator approval,
- admin identity fields by non-secret labels,
- backup/rollback expectation,
- customer impact boundary,
- no password printing,
- no provider sending,
- no migration or smoke in the same task.

## Provider / Migration / Smoke Separation

Admin seed must not:

- run migration,
- run migration dry-run,
- run smoke,
- call `/healthz`,
- probe endpoints,
- deploy or restart services,
- send LINE/SMS/email/app/webhook notifications,
- execute billing provider calls,
- execute AI/RAG provider calls,
- create invoice/payment/payment method behavior.

## Stop Conditions

Stop before any future admin seed if:

- target is unclear,
- target class is ambiguous,
- password is visible,
- password hash would be printed,
- `DATABASE_URL` or env values would be exposed,
- admin identity is ambiguous,
- duplicate admin behavior is unclear,
- seed script would send provider notifications,
- seed would run in the same task as migration,
- seed would run in the same task as smoke,
- target appears production without explicit production approval,
- output would expose secrets, raw DB rows, customer data, billing data, provider payloads, or AI output.

## Sanitized Completion Report Requirements

A future admin seed report may include:

- target label,
- target class,
- seed category `admin`,
- high-level PASS/FAIL,
- created/updated/skipped admin status,
- sanitized role/permission status summary,
- confirmation that password and hash were not printed,
- confirmation that migration, smoke, deploy, provider, billing, and AI did not run.

It must not include:

- admin password,
- password hash,
- `DATABASE_URL` value,
- credentials,
- tokens,
- private keys,
- Zeabur secrets,
- provider keys,
- raw DB rows,
- real customer/provider/billing data.

## Recommendation

Proceed to Task2031 as a no-seed test data fixture boundary. Do not run `npm run db:seed`, do not connect to DB, and do not create admin/test/customer/engineer/billing data from Task2030.

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
