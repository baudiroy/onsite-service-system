# Task2267 - Engineer Mobile Projection Read-Model Allowlist Static Guard

Status: implemented as static guard only

## Scope

This task adds a focused Engineer Mobile static guard for projection and read-model output allowlists. It does not execute Task2142 or any future task pack content, and it does not authorize any runtime behavior change.

Added files:

- `tests/engineerMobile/engineerMobileProjectionReadModelAllowlist.static.test.js`
- `docs/task-2267-engineer-mobile-projection-read-model-allowlist-static-guard-no-runtime-change-no-db-no-smoke-no-provider.md`

## Guard Coverage

The static guard reads Engineer Mobile source, tests, and planning docs as text only. It does not import Engineer Mobile runtime modules and does not execute DB, repository, route, provider, migration, server, or smoke behavior.

The guard checks that:

- Engineer Mobile task list and task detail read models expose explicit field allowlists.
- Assigned appointment list/detail projection services shape output through explicit selected fields and mapping functions.
- Known output mappers do not raw-spread or directly return raw rows, source objects, result objects, or candidate objects.
- Workbench safe envelope blocks raw DB rows, internal/debug/provider/audit-sensitive markers, `finalAppointmentId`, report IDs, raw SQL, tokens, passwords, secrets, cookies, authorization data, and full/private customer contact/address markers.
- Customer contact/address data remains minimized through masked name/phone and work-order summary fields in read models, plus limited display/location labels in assigned appointment projection contracts.
- Assignment, permission, organization scope, and action eligibility markers remain represented.
- Task2266 planning guardrails and existing Workbench read-only boundary static coverage remain present.

## Non-Runtime Confirmation

No runtime/source behavior was changed. No `src/`, package, migration, DB, route, provider, server/listener, smoke, env, Zeabur, admin frontend, AI/RAG, billing, settlement, payment, invoice, or Customer Access runtime files were modified.

The same 7 held historical docs remain untracked and untouched.

## Verification

Planned verification for this task:

- `node --test tests/engineerMobile/engineerMobileProjectionReadModelAllowlist.static.test.js`
- Re-run discoverable related Engineer Mobile static tests:
  - `node --test tests/engineerMobile/engineerMobileReadModelMapperMigrationAlignment.static.test.js`
  - `node --test tests/engineerMobile/engineerMobileAssignedAppointmentFieldContract.static.test.js`
  - `node --test tests/engineerMobile/engineerMobileReadModelFixtureContract.static.test.js`
  - `node --test tests/engineerMobile/engineerMobileWorkbenchReadOnlyBoundary.static.test.js`
  - `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionServiceClosure.static.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`
