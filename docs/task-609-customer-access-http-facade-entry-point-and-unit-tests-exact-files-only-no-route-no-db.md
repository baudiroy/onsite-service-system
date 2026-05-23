# Task 609 - Customer Access HTTP Facade Entry Point and Unit Tests / Exact Files Only / No Route / No DB

## Scope

Task609 creates a pure HTTP-facing Customer Access Facade entry point and unit tests.

Allowed files:

- `src/customerAccess/customerAccessHttpFacade.js`
- `tests/customerAccess/customerAccessHttpFacade.unit.test.js`
- `docs/task-609-customer-access-http-facade-entry-point-and-unit-tests-exact-files-only-no-route-no-db.md`

Task609 also applies one allowed minimal compatibility fix to:

- `src/customerAccess/customerAccessHttpContextAdapter.js`

Task609 does not modify any other file.

## HTTP Facade Entry Point

Task609 adds `src/customerAccess/customerAccessHttpFacade.js`.

Export:

- `buildCustomerAccessHttpResponse(input)`

The helper composes:

```text
HTTP-like context -> mapCustomerAccessHttpContext -> buildCustomerAccessFacadeResponse -> envelope
```

The helper:

- imports `mapCustomerAccessHttpContext`.
- imports `buildCustomerAccessFacadeResponse`.
- maps HTTP-like context first.
- calls the pure facade helper to produce allow / deny envelope.
- is deterministic.
- is side-effect free.
- fail-closed by default through adapter, mapper, resolver, service, and envelope behavior.
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

## Adapter Compatibility Fix

The HTTP facade unit test exposed one fail-closed compatibility issue:

- missing `params.caseId` could still pass through `caseLinkedToCustomer: true` from the synthetic access context.

Task609 applies a minimal adapter fix:

- `isCaseLinkedToCustomer` is now true only when `caseId` is present and `access.caseLinkedToCustomer === true`.

This does not loosen authorization.

The result is stricter fail-closed behavior.

## Unit Test Coverage

Task609 adds `tests/customerAccess/customerAccessHttpFacade.unit.test.js` using the Node built-in test runner.

The tests cover:

- valid verified HTTP-like context returns allow envelope.
- missing input returns generic safe-deny envelope.
- missing organization id returns generic safe-deny envelope.
- missing Case id returns generic safe-deny envelope.
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

The tests use synthetic HTTP-like input objects only.

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

Task609 does not implement:

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

Task609 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- HTTP facade cannot create, approve, complete, reopen, or publish a Field Service Report.
- HTTP facade cannot modify completion source-data.
- HTTP facade cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Verification

Allowed commands for Task609:

```bash
node --check src/customerAccess/customerAccessHttpFacade.js
node --check src/customerAccess/customerAccessHttpContextAdapter.js
node --check src/customerAccess/customerAccessFacade.js
node --test tests/customerAccess/customerAccessHttpFacade.unit.test.js
git diff --check -- src/customerAccess/customerAccessHttpFacade.js src/customerAccess/customerAccessHttpContextAdapter.js src/customerAccess/customerAccessFacade.js tests/customerAccess/customerAccessHttpFacade.unit.test.js docs/task-609-customer-access-http-facade-entry-point-and-unit-tests-exact-files-only-no-route-no-db.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task609.

## Guardrails Review

Task609 remains aligned with `PROJECT_GUARDRAILS.md`:

- no schema or migration change.
- no API change.
- no permission runtime integration.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
