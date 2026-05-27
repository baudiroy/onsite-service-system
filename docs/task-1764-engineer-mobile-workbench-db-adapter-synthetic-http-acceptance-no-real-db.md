# Task1764 - Engineer Mobile Workbench DB Adapter Synthetic HTTP Acceptance / No Real DB

## Scope

Task1764 adds test-only acceptance coverage for the accepted Engineer Mobile Workbench read-only DB adapter path.

Allowed files:

- `tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js`
- `docs/task-1764-engineer-mobile-workbench-db-adapter-synthetic-http-acceptance-no-real-db.md`

No runtime/source files were modified.

## Acceptance Path Covered

The new acceptance test proves this synthetic-only flow:

```text
synthetic HTTP request
-> injected request context resolver
-> Workbench read-only module
-> repository guard
-> DB repository adapter
-> SQL query builder
-> injected synthetic queryExecutor
-> projection normalizer
-> safe response envelope
```

The test uses the canonical read-only Workbench routes:

- `GET /engineer-mobile/appointments`
- `GET /engineer-mobile/appointments/:appointmentId`

The routes are registered only on an injected synthetic app object. There is no global app, server bootstrap, shared route mount, or `listen`.

## Behavior Locked

Task1764 confirms:

- Canonical list route flows through the DB adapter path.
- Canonical detail route flows through the DB adapter path.
- Request context comes from the injected resolver and synthetic request only.
- Repository guard wrapping is enabled.
- The SQL query builder produces safe frozen query specs.
- The injected synthetic query executor receives query specs only.
- Query specs include scoped params:
  - `organizationId`
  - `engineerUserId`
  - `appointmentId` for detail
- Executor rows are projected through the existing safe projection normalizer.
- Response envelopes remain safe.
- Executor throw fails closed without raw error leakage.
- Missing or denied request context fails closed before executor access.
- No mutation methods are called.
- No `listen` is called.
- The acceptance test does not require `src/app.js`, `src/server.js`, or `src/routes/**`.

## Forbidden Data Coverage

Synthetic rows and requests include forbidden values that must not leak:

- `finalAppointmentId`
- raw SQL marker text
- raw DB row marker text
- stack trace marker text
- internal notes
- provider/debug/private fields
- token, cookie, password, secret, authorization header markers
- raw phone and raw address markers
- untrusted body organization fields

The test asserts that those values do not appear in:

- query executor calls
- repository guard audit events
- list response envelope
- detail response envelope
- safe-deny response envelope

## Non-Goals

Task1764 does not:

- modify `src/**`
- modify runtime source
- create or alter routes in `src/routes/**`
- touch `src/app.js` or `src/server.js`
- create a real DB client, pool, or connection
- execute SQL against a database
- use `psql`
- run `db:migrate`
- create, alter, dry-run, or apply migrations
- change schema, DDL, indexes, or constraints
- run smoke checks
- mount global runtime routes
- send provider messages
- touch LINE, SMS, email, webhook, AI, RAG, billing, settlement, admin UI, or package files
- stage, clean, reset, stash, restore, remove, or commit held historical docs

## Core Invariants

Task1764 preserves the established case and Field Service Report boundaries:

- A Case can have multiple appointments / dispatch visits.
- A Case can have at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not touched.
- `finalAppointmentId` remains non-exposed in Engineer Mobile Workbench read responses.
- No appointment / dispatch / FSR review behavior is introduced.
- No second formal FSR creation path is introduced.

## Verification

Executed after implementation:

```bash
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js # PASS, 4 tests
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDbRepository.unit.test.js # PASS, 35 tests
/Users/global/.nvm/versions/node/v24.16.0/bin/node --test tests/engineerMobile/*.js # PASS, 893 tests
/Users/global/.nvm/versions/node/v24.16.0/bin/node /Users/global/.nvm/versions/node/v24.16.0/lib/node_modules/npm/bin/npm-cli.js run check # PASS
git diff --check --no-index /dev/null tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js # PASS
git diff --check --no-index /dev/null docs/task-1764-engineer-mobile-workbench-db-adapter-synthetic-http-acceptance-no-real-db.md # PASS
```

Credential-pattern scan over the Task1764 test and documentation files was clean.

No DB-backed checks and no smoke checks are part of Task1764.
