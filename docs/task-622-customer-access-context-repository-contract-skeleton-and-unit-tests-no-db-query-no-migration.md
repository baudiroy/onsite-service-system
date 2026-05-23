# Task 622 - Customer Access Context Repository Contract Skeleton and Unit Tests

## Scope

Task 622 added a customer access context repository contract skeleton and unit tests.

Changed files:

- `src/customerAccess/customerAccessContextRepository.js`
- `tests/customerAccess/customerAccessContextRepository.unit.test.js`
- `docs/task-622-customer-access-context-repository-contract-skeleton-and-unit-tests-no-db-query-no-migration.md`

This is a runtime + tests + docs slice. It defines the future DB-backed customer access lookup boundary without adding DB queries.

## Repository Contract

Exports:

- `CUSTOMER_ACCESS_CONTEXT_REPOSITORY_METHODS`
- `createCustomerAccessContextRepository(options)`

Contract methods:

- `getOrganizationScope(input)`
- `getVerifiedCustomerIdentity(input)`
- `getCaseLinkage(input)`
- `getPublicationState(input)`
- `getCustomerVisibleProjection(input)`

The default skeleton returns fail-closed unavailable results for every method.

## Explicit Non-goals

Task 622 did not add:

- DB client import
- transaction helper import
- SQL
- DB query
- existing repository integration
- route/controller/middleware integration
- provider integration
- AI/RAG behavior
- audit writes
- customer identity linkage
- publication state mutation
- Field Service Report, appointment, customer, or Case mutation
- migration
- smoke tests

## Safety Rules

The repository contract skeleton does not treat raw identifiers as verified identity.

Raw phone, raw address, raw LINE id, or scoped channel metadata alone do not verify a customer.

Default outputs do not include raw identifiers or internal data.

The skeleton does not output:

- raw phone/address/LINE id
- internal note
- audit log
- AI raw payload
- internal billing data
- customer-visible projection data

`finalAppointmentId` is not modified.

## Future DB-backed Work

Future DB-backed implementation must be a separate task with exact scope for:

- repository files
- read-only queries
- organization scope
- customer identity verification
- Case linkage
- publication state
- customer-visible projection
- permission and audit boundary
- tests

No DB-backed lookup was implemented in Task 622.

## Unit Test Coverage

The unit test covers:

- exports `createCustomerAccessContextRepository`
- exposes expected read-only contract methods
- organization scope defaults fail-closed
- raw phone does not verify identity
- raw address does not verify identity
- LINE id alone does not verify identity
- Case linkage defaults not linked
- publication state defaults not allowed
- customer-visible projection defaults empty/unavailable
- outputs do not expose raw identifiers or internal fields
- input object is not mutated
- `finalAppointmentId` is not modified
- repository module has no imports

## Invariants Preserved

Task 622 preserves:

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

- `node --check src/customerAccess/customerAccessContextRepository.js`
- `node --test tests/customerAccess/customerAccessContextRepository.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessContextRepository.js tests/customerAccess/customerAccessContextRepository.unit.test.js docs/task-622-customer-access-context-repository-contract-skeleton-and-unit-tests-no-db-query-no-migration.md`
