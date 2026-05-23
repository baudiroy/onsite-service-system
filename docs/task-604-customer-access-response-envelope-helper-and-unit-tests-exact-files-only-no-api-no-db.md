# Task 604 - Customer Access Response Envelope Helper and Unit Tests / Exact Files Only / No API / No DB

## Scope

Task604 creates the first Customer Access Response Envelope pure helper and unit tests.

Allowed files:

- `src/customerAccess/customerAccessResponseEnvelope.js`
- `tests/customerAccess/customerAccessResponseEnvelope.unit.test.js`
- `docs/task-604-customer-access-response-envelope-helper-and-unit-tests-exact-files-only-no-api-no-db.md`

Task604 does not modify any other file.

## Response Envelope Helper

Task604 adds `src/customerAccess/customerAccessResponseEnvelope.js`.

Exports:

- `buildCustomerAccessEnvelope(input)`
- `buildCustomerAccessAllowEnvelope(input)`
- `buildCustomerAccessDenyEnvelope(input)`

The helper is:

- CommonJS export.
- pure function only.
- deterministic input to envelope output.
- side-effect free.
- no DB.
- no repository.
- no route / controller / DTO / projection.
- no provider.
- no AI / RAG.
- no audit log write.
- no file storage access.
- no formal data mutation.

The helper does not make access decisions. It only packages caller-provided decision and customer-visible projection-like data.

## Envelope Behavior

Deny envelope:

- always uses generic safe-deny.
- does not expose internal resolver reason.
- does not expose Case existence.
- does not expose customer existence.
- does not expose organization mismatch.
- does not expose identity mismatch.
- does not expose publication state internal reason.
- does not expose permission details.
- does not expose raw phone / address / LINE id.
- does not expose internal note / audit log / AI raw payload / internal billing data.

Allow envelope:

- wraps caller-provided customer-visible data.
- recursively strips known forbidden keys.
- does not include full raw Case / Field Service Report / appointment / customer payload by itself.
- does not fetch data.
- does not create, approve, or publish a Field Service Report.
- does not modify completion source-data.
- does not modify `finalAppointmentId`.

## Unit Test Coverage

Task604 adds `tests/customerAccess/customerAccessResponseEnvelope.unit.test.js` using the Node built-in test runner.

The tests cover:

- deny envelope uses generic safe-deny.
- deny envelope does not expose internal resolver reason.
- deny envelope does not expose Case existence, customer existence, organization mismatch, identity mismatch, or publication reason.
- deny envelope does not expose raw phone / address / LINE id.
- allow envelope wraps only provided customer-visible service report data.
- allow envelope strips internal note, audit log, AI raw payload, and internal billing data.
- allow envelope strips raw LINE id, token, and secret.
- allow envelope strips unmasked phone and address while keeping masked public-safe values.
- malformed or missing input returns generic deny.
- input object is not mutated.
- `finalAppointmentId` is not modified.

The tests use synthetic input objects only.

The tests do not:

- start a server.
- connect to DB.
- import resolver.
- import repositories.
- import routes / controllers / DTOs / projections.
- import providers.
- import AI / RAG.
- use real customer PII.
- use token / secret / LINE credential.
- add fixture files.

## Runtime Boundary

Task604 does not implement:

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

Task604 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Envelope helper cannot create, approve, complete, reopen, or publish a Field Service Report.
- Envelope helper cannot modify completion source-data.
- Envelope helper cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Verification

Allowed commands for Task604:

```bash
node --check src/customerAccess/customerAccessResponseEnvelope.js
node --test tests/customerAccess/customerAccessResponseEnvelope.unit.test.js
git diff --check -- src/customerAccess/customerAccessResponseEnvelope.js tests/customerAccess/customerAccessResponseEnvelope.unit.test.js docs/task-604-customer-access-response-envelope-helper-and-unit-tests-exact-files-only-no-api-no-db.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task604.

## Guardrails Review

Task604 remains aligned with `PROJECT_GUARDRAILS.md`:

- no schema or migration change.
- no API change.
- no permission runtime integration.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
