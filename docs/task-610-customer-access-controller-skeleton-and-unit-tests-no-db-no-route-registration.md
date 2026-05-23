# Task 610 - Customer Access Controller Skeleton and Unit Tests / No DB / No Route Registration

## Scope

Task610 creates a minimal Customer Access Controller skeleton and unit tests.

Allowed files:

- `src/controllers/customerAccessController.js`
- `tests/customerAccess/customerAccessController.unit.test.js`
- `docs/task-610-customer-access-controller-skeleton-and-unit-tests-no-db-no-route-registration.md`

Task610 does not modify any other file.

## Controller Skeleton

Task610 adds `src/controllers/customerAccessController.js`.

Exports:

- `buildCustomerAccessControllerResponse(req)`
- `handleCustomerAccessRequest(req, res)`

`buildCustomerAccessControllerResponse(req)`:

- builds an HTTP-like context from future middleware-provided `req` fields.
- calls `buildCustomerAccessHttpResponse(context)`.
- returns the envelope.
- is unit-testable without server startup.

`handleCustomerAccessRequest(req, res)`:

- is a thin wrapper.
- calls `buildCustomerAccessControllerResponse(req)`.
- returns `res.status(...).json(...)`.
- returns HTTP `200` for allow envelope.
- returns HTTP `404` generic unavailable for deny / safe-deny envelope.

The current deny status is `404` to avoid existence leakage.

The controller imports only:

- `src/customerAccess/customerAccessHttpFacade.js`

## Controller Boundary

Task610 does not create route registration.

The controller skeleton accepts future middleware-provided fields such as:

- `req.params.caseId`
- `req.auth.organizationId`
- `req.auth.customerId`
- `req.auth.customerIdentityVerified`
- `req.channel.lineChannelId`
- `req.channel.lineUserId`
- `req.access.caseLinkedToCustomer`
- `req.access.publicationAllowed`
- `req.access.customerVisiblePolicyPassed`
- `req.customerVisibleData`

The controller does not:

- import DB.
- import repository.
- import route.
- import DTO / projection.
- import provider / LINE / SMS / Email / App push.
- import AI / RAG.
- write audit log.
- write Field Service Report / appointment / publication / customer identity.
- modify `finalAppointmentId`.
- decide access permission by itself.
- decide publication allowed by itself.
- treat raw phone / address / LINE id as verified identity.
- expose internal note / audit log / AI raw payload / internal billing data.

## Unit Test Coverage

Task610 adds `tests/customerAccess/customerAccessController.unit.test.js` using the Node built-in test runner.

The tests cover:

- valid verified request returns `200` allow envelope.
- missing input / empty req returns generic safe-deny without exception.
- missing organization id returns generic safe-deny.
- missing Case id returns generic safe-deny.
- unverified customer identity returns generic safe-deny.
- raw phone only does not authorize.
- raw address only does not authorize.
- LINE id alone does not authorize.
- `organizationId + lineChannelId + lineUserId` alone does not authorize.
- publication not allowed returns generic safe-deny.
- customer-visible policy failure returns generic safe-deny.
- deny response does not expose internal reason.
- output does not expose raw phone / address / LINE id.
- output does not expose internal note / audit log / AI raw payload / internal billing data.
- handler writes `res.status(...).json(...)` once for allow.
- handler writes `res.status(...).json(...)` once for deny.
- input `req` object is not mutated.
- `finalAppointmentId` is not modified.

The tests use synthetic `req` / `res` objects only.

The tests do not:

- start a server.
- register a route.
- connect to DB.
- import repositories.
- import DTOs / projections.
- import providers.
- import AI / RAG.
- use real customer PII.
- use token / secret / LINE credential.
- add fixture files.

## Runtime Boundary

Task610 does not implement:

- route registration.
- API endpoint wiring.
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

Task610 preserves:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Controller cannot create, approve, complete, reopen, or publish a Field Service Report.
- Controller cannot modify completion source-data.
- Controller cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Verification

Allowed commands for Task610:

```bash
node --check src/controllers/customerAccessController.js
node --test tests/customerAccess/customerAccessController.unit.test.js
git diff --check -- src/controllers/customerAccessController.js tests/customerAccess/customerAccessController.unit.test.js docs/task-610-customer-access-controller-skeleton-and-unit-tests-no-db-no-route-registration.md
```

No smoke tests, DB commands, migration commands, API commands, browser commands, or provider sending commands are part of Task610.

## Guardrails Review

Task610 remains aligned with `PROJECT_GUARDRAILS.md`:

- no schema or migration change.
- no API route registration.
- no DB / repository integration.
- no permission runtime integration.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime write.
- no organization isolation runtime write.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
