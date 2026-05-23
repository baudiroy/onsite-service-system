# Task 605 - Customer Access Pure Service Composition Helper and Unit Tests / Exact Files Only / No API / No DB

## Scope

Task605 creates a pure composition helper that combines the Customer Access Resolver decision with the Customer Access Response Envelope helper.

Allowed files:

- `src/customerAccess/customerAccessService.js`
- `tests/customerAccess/customerAccessService.unit.test.js`
- `docs/task-605-customer-access-pure-service-composition-helper-and-unit-tests-exact-files-only-no-api-no-db.md`

Task605 does not modify any other file.

## Service Composition Helper

Task605 adds `src/customerAccess/customerAccessService.js`.

Export:

- `buildCustomerAccessResponse(input)`

The helper:

- imports `resolveCustomerAccess` from `src/customerAccess/customerAccessResolver.js`.
- imports `buildCustomerAccessEnvelope` from `src/customerAccess/customerAccessResponseEnvelope.js`.
- calls the resolver to get a decision.
- returns generic safe-deny envelope when access is denied.
- returns allow envelope with caller-provided `customerVisibleData` or `data` when access is allowed.

The helper is:

- deterministic.
- side-effect free.
- fail-closed by default through resolver and envelope behavior.
- no DB.
- no repository.
- no route / controller / DTO / projection.
- no provider.
- no AI / RAG.
- no audit log write.
- no file storage access.
- no formal data mutation.

The helper does not:

- query Case / Customer / Field Service Report / appointment data.
- decide publication allowed by itself.
- create or modify publication state.
- write audit log.
- modify `finalAppointmentId`.

## Unit Test Coverage

Task605 adds `tests/customerAccess/customerAccessService.unit.test.js` using the Node built-in test runner.

The tests cover:

- valid access returns allow envelope.
- denied access returns generic safe-deny envelope.
- missing input returns generic safe-deny envelope.
- raw phone only returns generic safe-deny envelope.
- raw address only returns generic safe-deny envelope.
- LINE id alone returns generic safe-deny envelope.
- scoped channel identity only returns generic safe-deny envelope.
- allow response strips forbidden customer-visible fields through the envelope helper.
- deny response does not expose resolver internal reason.
- output does not expose raw phone / address / LINE id.
- output does not expose internal note / audit log / AI raw payload / internal billing data.
- input object is not mutated.
- `finalAppointmentId` is not modified.

The tests use synthetic input objects only.

The tests do not:

- start a server.
- connect to DB.
- import routes / controllers / DTOs / projections.
- import repositories.
- import providers.
- import AI / RAG.
- use real customer PII.
- use token / secret / LINE credential.
- add fixture files.

## Runtime Boundary

Task605 does not implement:

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

Task605 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Service composition helper cannot create, approve, complete, reopen, or publish a Field Service Report.
- Service composition helper cannot modify completion source-data.
- Service composition helper cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Verification

Allowed commands for Task605:

```bash
node --check src/customerAccess/customerAccessService.js
node --test tests/customerAccess/customerAccessService.unit.test.js
git diff --check -- src/customerAccess/customerAccessService.js tests/customerAccess/customerAccessService.unit.test.js docs/task-605-customer-access-pure-service-composition-helper-and-unit-tests-exact-files-only-no-api-no-db.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task605.

## Guardrails Review

Task605 remains aligned with `PROJECT_GUARDRAILS.md`:

- no schema or migration change.
- no API change.
- no permission runtime integration beyond pure function composition.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
