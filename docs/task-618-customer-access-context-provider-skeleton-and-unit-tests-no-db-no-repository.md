# Task 618 - Customer Access Context Provider Skeleton and Unit Tests

## Scope

Task 618 added a pure customer access context provider skeleton and unit tests.

Changed files:

- `src/customerAccess/customerAccessContextProvider.js`
- `tests/customerAccess/customerAccessContextProvider.unit.test.js`
- `docs/task-618-customer-access-context-provider-skeleton-and-unit-tests-no-db-no-repository.md`

This is a small runtime + tests + docs slice, following the user's instruction to move clear functionality forward while keeping each task tightly scoped.

## Provider Behavior

`buildCustomerAccessContext(input)` maps caller-provided verified context into the existing controller-compatible shape:

- `params.caseId`
- `auth.organizationId`
- `auth.customerId`
- `auth.customerIdentityVerified`
- `channel.lineChannelId`
- `channel.lineUserId`
- `access.organizationScopeMatched`
- `access.caseLinkedToCustomer`
- `access.publicationAllowed`
- `access.customerVisiblePolicyPassed`
- `customerVisibleData`

The provider is:

- CommonJS
- pure
- deterministic
- side-effect free
- fail-closed by default

## Explicit Non-goals

Task 618 did not add:

- DB access
- repository access
- route/controller integration
- middleware runtime
- provider integration
- LINE/SMS/Email/App push behavior
- AI/RAG behavior
- audit writes
- migration
- smoke tests

The provider does not check Case, Customer, Field Service Report, appointment, or publication rows. It only accepts caller-provided verified flags that a future DB-backed resolver/middleware may produce.

## Safety Rules

The provider does not treat raw identifiers as verified identity.

Raw phone, raw address, raw LINE id, or scoped channel metadata alone do not verify a customer.

Forbidden/internal customer-visible fields are stripped, including:

- `internalNote`
- `auditLog`
- `aiRawPayload`
- `internalBillingData`
- `settlementInternalData`
- raw phone/address/LINE id
- token/secret

`finalAppointmentId` is preserved when already present in customer-visible publication-like data and is not modified.

## Unit Test Coverage

The unit test covers:

- valid verified context maps to controller-compatible context
- missing input maps fail-closed
- missing organization id maps fail-closed for organization scope
- missing case id maps fail-closed for organization scope
- unverified identity remains unverified
- raw phone only does not become verified identity
- raw address only does not become verified identity
- line user id alone does not become verified identity
- scoped channel metadata alone does not become verified identity
- publication not allowed remains not allowed
- customer-visible policy failure remains failed
- forbidden fields are stripped
- input object is not mutated
- `finalAppointmentId` is not modified

## Invariants Preserved

Task 618 preserves:

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

- `node --check src/customerAccess/customerAccessContextProvider.js`
- `node --test tests/customerAccess/customerAccessContextProvider.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessContextProvider.js tests/customerAccess/customerAccessContextProvider.unit.test.js docs/task-618-customer-access-context-provider-skeleton-and-unit-tests-no-db-no-repository.md`
