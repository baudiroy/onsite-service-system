# Task 606 - Customer Access Request Mapper and Unit Tests / Exact Files Only / No API / No DB

## Scope

Task606 creates a pure Customer Access Request Mapper and unit tests.

Allowed files:

- `src/customerAccess/customerAccessRequestMapper.js`
- `tests/customerAccess/customerAccessRequestMapper.unit.test.js`
- `docs/task-606-customer-access-request-mapper-and-unit-tests-exact-files-only-no-api-no-db.md`

Task606 does not modify any other file.

## Request Mapper

Task606 adds `src/customerAccess/customerAccessRequestMapper.js`.

Export:

- `mapCustomerAccessRequest(input)`

The mapper converts caller-provided request-like context into the input shape expected by the customer access service / resolver flow.

The mapper:

- is CommonJS.
- is pure function only.
- is deterministic input to mapped output.
- is side-effect free.
- imports nothing.
- does not read DB.
- does not import repository.
- does not import route / controller / DTO / projection.
- does not import provider / LINE / SMS / Email / App push.
- does not import AI / RAG / vector DB.
- does not write audit log.
- does not write Field Service Report / appointment / publication / customer identity.
- does not modify `finalAppointmentId`.

## Mapper Boundary

The mapper only organizes caller-provided context.

The mapper does not:

- make access decisions.
- query Case / Customer / Field Service Report / appointment data.
- decide publication allowed by itself.
- establish customer identity linkage.
- trust raw phone as identity verification.
- trust raw address as identity verification.
- trust raw LINE id as identity verification.
- convert scoped channel identity into verified customer identity.
- produce complete Field Service Report / appointment / customer payloads.

The mapper strips known forbidden fields from `customerVisibleData`, including internal note, audit log, AI raw payload, internal billing data, token, secret, raw phone, raw address, and raw LINE id.

## Unit Test Coverage

Task606 adds `tests/customerAccess/customerAccessRequestMapper.unit.test.js` using the Node built-in test runner.

The tests cover:

- valid verified customer access request maps into service input shape.
- missing input maps to fail-closed input.
- missing organization id maps to fail-closed input.
- unverified customer identity remains unverified.
- raw phone only does not become verified identity.
- raw address only does not become verified identity.
- LINE user id alone does not become verified identity.
- `organizationId + lineChannelId + lineUserId` alone does not become verified identity.
- missing Case linkage maps to fail-closed input.
- publication not allowed remains not allowed.
- customer-visible policy failure remains failed.
- internal note / audit log / AI raw payload / internal billing data / token / secret are stripped or ignored.
- mapped output does not expose raw phone / address / LINE id.
- input object is not mutated.
- `finalAppointmentId` is not modified.

The tests use synthetic input objects only.

The tests do not:

- start a server.
- connect to DB.
- import resolver / service / envelope.
- import routes / controllers / DTOs / projections.
- import repositories.
- import providers.
- import AI / RAG.
- use real customer PII.
- use token / secret / LINE credential.
- add fixture files.

## Runtime Boundary

Task606 does not implement:

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

Task606 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Mapper cannot create, approve, complete, reopen, or publish a Field Service Report.
- Mapper cannot modify completion source-data.
- Mapper cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed in the downstream resolver / service.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Verification

Allowed commands for Task606:

```bash
node --check src/customerAccess/customerAccessRequestMapper.js
node --test tests/customerAccess/customerAccessRequestMapper.unit.test.js
git diff --check -- src/customerAccess/customerAccessRequestMapper.js tests/customerAccess/customerAccessRequestMapper.unit.test.js docs/task-606-customer-access-request-mapper-and-unit-tests-exact-files-only-no-api-no-db.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task606.

## Guardrails Review

Task606 remains aligned with `PROJECT_GUARDRAILS.md`:

- no schema or migration change.
- no API change.
- no permission runtime integration.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
