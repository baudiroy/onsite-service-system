# Task 608 - Customer Access HTTP Context Adapter and Unit Tests / Exact Files Only / No Route / No DB

## Scope

Task608 creates a pure Customer Access HTTP Context Adapter and unit tests.

Allowed files:

- `src/customerAccess/customerAccessHttpContextAdapter.js`
- `tests/customerAccess/customerAccessHttpContextAdapter.unit.test.js`
- `docs/task-608-customer-access-http-context-adapter-and-unit-tests-exact-files-only-no-route-no-db.md`

Task608 does not modify any other file.

## HTTP Context Adapter

Task608 adds `src/customerAccess/customerAccessHttpContextAdapter.js`.

Export:

- `mapCustomerAccessHttpContext(input)`

The adapter converts future controller-provided HTTP-like context into the request-like input shape used by the customer access facade / mapper flow.

The adapter:

- is CommonJS.
- is pure function only.
- is deterministic input to request-like output.
- is side-effect free.
- imports nothing.
- does not import facade / mapper / service / resolver / envelope.
- does not import route / controller / DTO / projection.
- does not read DB.
- does not import repository.
- does not import provider / LINE / SMS / Email / App push.
- does not import AI / RAG / vector DB.
- does not write audit log.
- does not establish customer identity linkage.
- does not decide publication allowed.
- does not treat raw phone / address / LINE id as verified identity.
- does not modify `finalAppointmentId`.

## Adapter Boundary

The adapter may accept future synthetic controller context such as:

```js
{
  params: { caseId: 'case_test' },
  auth: {
    organizationId: 'org_test',
    customerId: 'customer_test',
    customerIdentityVerified: true
  },
  channel: {
    lineChannelId: 'line_channel_test',
    lineUserId: 'line_user_test'
  },
  access: {
    organizationScopeMatched: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true
  },
  customerVisibleData: {
    serviceReport: {}
  }
}
```

The adapter outputs request-like input with:

- `organizationId`.
- `caseId`.
- `customerId`.
- `isCustomerIdentityVerified`.
- `isCaseLinkedToCustomer`.
- `isPublicationAllowed`.
- `isCustomerVisiblePolicyPassed`.
- `organizationScopeMatches`.
- channel identity presence booleans.
- sanitized `customerVisibleData`.

The adapter does not output raw LINE user id.

The adapter strips known forbidden fields from `customerVisibleData`, including internal note, audit log, AI raw payload, internal billing data, token, secret, raw phone, raw address, and raw LINE id.

## Unit Test Coverage

Task608 adds `tests/customerAccess/customerAccessHttpContextAdapter.unit.test.js` using the Node built-in test runner.

The tests cover:

- valid HTTP-like context maps into request-like facade input.
- missing input maps to fail-closed request-like input.
- missing `auth.organizationId` maps to fail-closed input.
- missing `params.caseId` maps to fail-closed input.
- unverified identity remains unverified.
- raw phone only does not become verified identity.
- raw address only does not become verified identity.
- LINE user id alone does not become verified identity.
- `organizationId + lineChannelId + lineUserId` alone does not become verified identity.
- publication not allowed remains not allowed.
- customer-visible policy failure remains failed.
- internal note / audit log / AI raw payload / internal billing data / token / secret are stripped or ignored.
- output does not expose raw phone / address / LINE id.
- input object is not mutated.
- `finalAppointmentId` is not modified.

The tests use synthetic input objects only.

The tests do not:

- start a server.
- connect to DB.
- import facade / mapper / service / resolver / envelope.
- import routes / controllers / DTOs / projections.
- import repositories.
- import providers.
- import AI / RAG.
- use real customer PII.
- use token / secret / LINE credential.
- add fixture files.

## Runtime Boundary

Task608 does not implement:

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

Task608 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Adapter cannot create, approve, complete, reopen, or publish a Field Service Report.
- Adapter cannot modify completion source-data.
- Adapter cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed in the downstream resolver / service.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Verification

Allowed commands for Task608:

```bash
node --check src/customerAccess/customerAccessHttpContextAdapter.js
node --test tests/customerAccess/customerAccessHttpContextAdapter.unit.test.js
git diff --check -- src/customerAccess/customerAccessHttpContextAdapter.js tests/customerAccess/customerAccessHttpContextAdapter.unit.test.js docs/task-608-customer-access-http-context-adapter-and-unit-tests-exact-files-only-no-route-no-db.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task608.

## Guardrails Review

Task608 remains aligned with `PROJECT_GUARDRAILS.md`:

- no schema or migration change.
- no API change.
- no permission runtime integration.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
