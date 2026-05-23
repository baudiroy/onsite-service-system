# Task 607 - Customer Access Pure Facade and Unit Tests / Exact Files Only / No API / No DB

## Scope

Task607 creates a pure Customer Access Facade helper and unit tests.

Allowed files:

- `src/customerAccess/customerAccessFacade.js`
- `tests/customerAccess/customerAccessFacade.unit.test.js`
- `docs/task-607-customer-access-pure-facade-and-unit-tests-exact-files-only-no-api-no-db.md`

No mapper / service compatibility fix was required.

Task607 does not modify any other file.

## Facade Helper

Task607 adds `src/customerAccess/customerAccessFacade.js`.

Export:

- `buildCustomerAccessFacadeResponse(input)`

The facade composes:

```text
request-like input -> mapCustomerAccessRequest -> buildCustomerAccessResponse -> envelope
```

The facade:

- imports `mapCustomerAccessRequest`.
- imports `buildCustomerAccessResponse`.
- maps request-like input first.
- calls the service helper to produce allow / deny envelope.
- is deterministic.
- is side-effect free.
- fail-closed by default through mapper, resolver, service, and envelope behavior.
- does not read DB.
- does not import repository.
- does not import route / controller / DTO / projection.
- does not import provider / LINE / SMS / Email / App push.
- does not import AI / RAG / vector DB.
- does not write audit log.
- does not write Field Service Report / appointment / publication / customer identity.
- does not modify `finalAppointmentId`.
- does not independently decide access permission.
- does not independently decide publication allowed.
- does not treat raw phone / address / LINE id as verified identity.

## Mapper / Service Compatibility

No mapper or service fix was needed.

The Task606 mapper output is compatible with the Task605 service composition input shape.

## Unit Test Coverage

Task607 adds `tests/customerAccess/customerAccessFacade.unit.test.js` using the Node built-in test runner.

The tests cover:

- valid verified request-like input returns allow envelope.
- missing input returns generic safe-deny envelope.
- missing organization id returns generic safe-deny envelope.
- unverified customer identity returns generic safe-deny envelope.
- raw phone only returns generic safe-deny envelope.
- raw address only returns generic safe-deny envelope.
- LINE id alone returns generic safe-deny envelope.
- `organizationId + lineChannelId + lineUserId` alone returns generic safe-deny envelope.
- missing Case linkage returns generic safe-deny envelope.
- publication not allowed returns generic safe-deny envelope.
- customer-visible policy failure returns generic safe-deny envelope.
- allow envelope strips forbidden customer-visible fields.
- deny response does not expose internal reason.
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

Task607 does not implement:

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

Task607 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Facade cannot create, approve, complete, reopen, or publish a Field Service Report.
- Facade cannot modify completion source-data.
- Facade cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Verification

Allowed commands for Task607:

```bash
node --check src/customerAccess/customerAccessFacade.js
node --check src/customerAccess/customerAccessRequestMapper.js
node --check src/customerAccess/customerAccessService.js
node --test tests/customerAccess/customerAccessFacade.unit.test.js
git diff --check -- src/customerAccess/customerAccessFacade.js src/customerAccess/customerAccessRequestMapper.js src/customerAccess/customerAccessService.js tests/customerAccess/customerAccessFacade.unit.test.js docs/task-607-customer-access-pure-facade-and-unit-tests-exact-files-only-no-api-no-db.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task607.

## Guardrails Review

Task607 remains aligned with `PROJECT_GUARDRAILS.md`:

- no schema or migration change.
- no API change.
- no permission runtime integration.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
