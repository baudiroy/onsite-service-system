# Task 603 - Customer Access Resolver Unit Tests and Safe Fixes / Exact Files Only / No API / No DB

## Scope

Task603 adds unit tests for the Task602 Customer Access Resolver pure function skeleton and applies only minimal safe fixes exposed by those tests.

Allowed files:

- `src/customerAccess/customerAccessResolver.js`
- `tests/customerAccess/customerAccessResolver.unit.test.js`
- `docs/task-603-customer-access-resolver-unit-tests-and-safe-fixes-exact-files-only-no-api-no-db.md`

Task603 does not modify any other file.

## Unit Test Coverage

Task603 adds `tests/customerAccess/customerAccessResolver.unit.test.js` using the Node built-in test runner.

The tests cover:

- allow for valid organization scope, verified customer identity, linked Case, publication allowed, and customer-visible policy passed.
- deny missing input.
- deny missing organization scope.
- deny unverified customer identity.
- deny raw phone only.
- deny raw address only.
- deny LINE id alone.
- deny `organization_id + line_channel_id + line_user_id` alone.
- deny missing Case linkage.
- deny publication not allowed.
- deny customer-visible policy failure.
- sensitive output scan for deny and allow decisions.
- no input mutation.
- no `finalAppointmentId` mutation.

The tests use synthetic input objects only.

The tests do not:

- start a server.
- connect to DB.
- import repositories.
- import routes / controllers / DTOs / projections.
- import providers.
- import AI / RAG.
- use real customer PII.
- use token / secret / LINE credential.
- add fixture files.

## Resolver Safe Fix

The unit tests exposed one safe-deny classification issue:

- `organization_id + line_channel_id + line_user_id` alone was denied, but it was classified as `LINE_ID_ONLY` before the more precise `SCOPED_CHANNEL_IDENTITY_ONLY`.

Task603 applies a minimal resolver fix:

- scoped channel identity is now recognized only when organization id, LINE channel id, and LINE user id are all present.
- scoped channel identity insufficiency is checked before single LINE id insufficiency.

This does not relax access.

The result remains fail-closed.

## Runtime Boundary

Task603 does not implement:

- API route.
- controller.
- DTO.
- projection service.
- repository.
- DB query.
- migration.
- provider sending.
- LINE / SMS / Email / App push.
- AI / RAG / vector DB.
- audit log write.
- file storage access.
- Field Service Report write.
- appointment write.
- publication state write.
- customer identity write.
- `finalAppointmentId` modification.

## Mandatory Invariants

Task603 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, complete, reopen, or publish a Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Resolver output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, raw phone, raw address, or raw LINE id.

## Verification

Allowed commands for Task603:

```bash
node --check src/customerAccess/customerAccessResolver.js
node --test tests/customerAccess/customerAccessResolver.unit.test.js
git diff --check -- src/customerAccess/customerAccessResolver.js tests/customerAccess/customerAccessResolver.unit.test.js docs/task-603-customer-access-resolver-unit-tests-and-safe-fixes-exact-files-only-no-api-no-db.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task603.

## Guardrails Review

Task603 remains aligned with `PROJECT_GUARDRAILS.md`:

- no schema or migration change.
- no API change.
- no permission runtime integration beyond pure function test coverage.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
