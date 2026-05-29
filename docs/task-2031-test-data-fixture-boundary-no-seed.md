# Task2031 Test Data Fixture Boundary / No Seed

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 22 - Migration and Seed Authorization Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2031-test-data-fixture-boundary-no-seed.md`
- Current local baseline before this task: Task2030 committed as `cb6f3b2`.
- This task is fixture boundary planning only.
- No fixture data was created.
- No seed was run.
- No DB connection, SQL, migration, smoke, endpoint probe, deploy, provider, billing, or AI execution occurred.
- No secrets were printed.

## Fixture Principles

- Use fake IDs and fake names only.
- Do not use real customer data.
- Do not use real phone numbers or addresses unless they are clearly fake and marked as fake.
- Do not use real payment methods.
- Do not use real billing data.
- Do not send providers.
- Do not put sensitive data into AI provider input.
- Keep fixture purpose, target, and cleanup expectation explicit.
- Fixture seed is separate from admin seed, migration apply, and smoke execution.

## Fixture Boundary Matrix

| Fixture category | Allowed test/smoke use | Forbidden production use | PII minimization | Provider/billing/AI restrictions | Cleanup expectation | Destructive? |
| --- | --- | --- | --- | --- | --- | --- |
| Organization | Tenant/org scope for isolated tests | Do not create or modify production orgs from generic flow | Fake organization name and code only | No provider, billing, or AI side effects | Remove or mark disposable if target permits cleanup | Usually non-destructive if isolated |
| Admin user | Admin login/bootstrap in approved test target | No production admin without production approval | Fake or approved admin email/display label; password outside Codex | No provider notifications | Disable/delete only under approved cleanup task | Potentially destructive if altering existing user |
| Engineer user | Engineer Mobile authenticated smoke fixture | Do not use real technician identity without approval | Fake engineer name/email; no real phone/address | No SMS/app/LINE sending | Remove assignment/user fixture if approved | Potentially destructive if assigned to real work |
| Customer access context | Customer-facing route allow/safe-deny testing | Do not expose real customer case/report | Fake customer label; fake contact data only | No provider sending, no customer-visible publication | Remove/revoke access fixture if approved | Potentially destructive if linked to real customer |
| Appointment | Engineer Mobile or dispatch flow smoke fixture | Do not mutate live appointments | Fake case/appointment references only | No provider sending, no FSR/finalAppointmentId behavior | Delete/reset only under explicit cleanup | Destructive if it changes lifecycle |
| Repair intake draft | Repair intake draft-to-case planning/smoke fixture | Do not convert real intake without approval | Fake reporter/customer/contact summary | No provider sending, no real case creation unless scoped | Expire/delete fake draft if approved | Destructive if converting to case |
| Depot workshop intake | Depot/workshop repair route fixture | Do not expose real depot/customer data | Fake repair/device/customer labels only | No provider sending, no customer contact | Remove fake repair intake if approved | Destructive if status changes matter |
| SaaS entitlement | Tenant/admin entitlement smoke fixture | Do not alter paid/customer entitlements | Fake tenant plan labels only | No billing provider, invoice, payment, or payment method | Revoke fake entitlement if approved | Destructive if applied to live tenant |
| Audit-only fixture | Verify audit visibility and safe metadata | Do not write audit for real customer action unless scoped | Minimal symbolic ids and safe metadata | No provider/billing/AI payloads | Usually retained only in disposable/test DB | Non-destructive if isolated |

## Fake Data Rules

- IDs should be clearly fake or generated within a disposable/test target.
- Names should include a test marker such as `Test`, `Smoke`, or `Fixture`.
- Phone/address fields should be omitted unless the test explicitly needs fake contact formatting.
- Any fake phone/address must be clearly non-real and must not be copied from customers.
- Emails should use reserved/fake domains where possible.
- Payment fields must be absent unless a future billing sandbox task explicitly scopes them.
- AI inputs must not contain customer-sensitive text, provider credentials, contact data, payment data, or internal secrets.

## Cleanup Rules

Cleanup must be separately scoped unless the future fixture task explicitly includes cleanup.

Cleanup reporting must be sanitized and may include only:

- fixture category,
- target label,
- fake fixture ids or labels if safe,
- created/removed/skipped counts,
- high-level PASS/FAIL.

Cleanup must not include:

- production cleanup,
- destructive deletion against shared/prod data,
- raw customer data,
- payment data,
- provider payloads,
- secrets,
- improvised SQL.

## Stop Conditions

Stop before fixture creation if:

- target is unnamed,
- target class is ambiguous,
- target appears production/shared without explicit approval,
- real customer data is requested,
- real phone/address/payment data is requested,
- provider sending would be triggered,
- billing provider or payment method behavior would be triggered,
- AI provider input would include sensitive data,
- fixture would create customer-visible publication,
- fixture would create or mutate Completion Report / FSR behavior,
- fixture would mutate `finalAppointmentId`,
- cleanup expectation is unclear for destructive fixtures,
- output would expose secrets, raw DB rows, customer data, provider payloads, billing data, or AI output.

## Recommendation

Proceed to Task2032 as a no-execution migration rollback and stop-condition checklist. Do not run seed, create fixtures, connect to DB, or run smoke from Task2031.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified.
- No fixture data was created.
- No DB connection, SQL, `psql`, migration dry-run, migration apply, or seed was run.
- No smoke, endpoint probe, or `/healthz` call was run.
- No Zeabur env value was inspected or changed.
- No deploy, redeploy, restart, or rollback was performed.
- No provider, billing, or AI execution was performed.
- No secrets were printed.
- No `finalAppointmentId`, Completion Report / FSR, or customer-visible publication behavior was touched.
- The 7 held historical untracked docs were not touched.
