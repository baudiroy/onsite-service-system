# Task 619 - Customer Access Context Middleware Skeleton and Unit Tests

## Scope

Task 619 added a customer access context middleware skeleton and unit tests.

Changed files:

- `src/customerAccess/customerAccessContextMiddleware.js`
- `tests/customerAccess/customerAccessContextMiddleware.unit.test.js`
- `docs/task-619-customer-access-context-middleware-skeleton-and-unit-tests-no-db-no-repository.md`

This is a runtime + tests + docs slice, following the user's instruction to keep development moving in small scoped steps.

## Middleware Behavior

Exports:

- `buildCustomerAccessContextMiddleware(options)`
- `applyCustomerAccessContextToRequest(req, context)`

The middleware:

- reads caller-provided `req.customerAccessContextInput`
- calls `buildCustomerAccessContext(input)`
- writes controller-compatible fields onto `req`
- calls `next()` exactly once when `next` is a function
- does not throw when `next` is missing or invalid
- fail-closes when context input is missing or malformed

Fields populated:

- `req.params.caseId`
- `req.auth.organizationId`
- `req.auth.customerId`
- `req.auth.customerIdentityVerified`
- `req.channel.lineChannelId`
- `req.channel.lineUserId`
- `req.access.organizationScopeMatched`
- `req.access.caseLinkedToCustomer`
- `req.access.publicationAllowed`
- `req.access.customerVisiblePolicyPassed`
- `req.customerVisibleData`

## Explicit Non-goals

Task 619 did not add:

- DB access
- repository access
- route/controller/app integration
- middleware mount in production routing
- provider integration
- LINE/SMS/Email/App push behavior
- AI/RAG behavior
- audit writes
- migration
- smoke tests

The middleware is the future DB-backed access context insertion point, but currently accepts only caller-provided context input.

## Safety Rules

The middleware does not treat raw identifiers as verified identity.

Raw phone, raw address, raw LINE id, or scoped channel metadata alone do not verify a customer.

Forbidden/internal customer-visible fields are stripped by the provider before being written to the request, including:

- `internalNote`
- `auditLog`
- `aiRawPayload`
- `internalBillingData`
- raw phone/address/LINE id
- token/secret

`finalAppointmentId` is preserved when already present in customer-visible publication-like data and is not modified.

## Unit Test Coverage

The unit test covers:

- middleware builder returns function
- valid context input populates controller-compatible request fields
- missing context input populates fail-closed request fields
- middleware calls `next()` exactly once
- invalid or missing `next` does not throw
- raw phone only does not become verified identity
- raw address only does not become verified identity
- line user id alone does not become verified identity
- scoped channel metadata alone does not become verified identity
- forbidden fields are stripped
- `finalAppointmentId` is not modified
- unrelated request fields are not mutated
- `applyCustomerAccessContextToRequest` performs bounded request mutation

## Invariants Preserved

Task 619 preserves:

- one Case = one formal Field Service Report
- customer-facing report is a filtered publication view
- LINE user id is not a global identity
- no internal data leakage
- organization isolation remains required for future verified context
- no AI auto decision
- no migration/schema/index change
- no sensitive output

## Verification

Planned verification:

- `node --check src/customerAccess/customerAccessContextMiddleware.js`
- `node --test tests/customerAccess/customerAccessContextMiddleware.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessContextMiddleware.js tests/customerAccess/customerAccessContextMiddleware.unit.test.js docs/task-619-customer-access-context-middleware-skeleton-and-unit-tests-no-db-no-repository.md`
