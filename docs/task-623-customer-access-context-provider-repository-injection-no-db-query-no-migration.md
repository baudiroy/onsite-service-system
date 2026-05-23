# Task 623 - Customer Access Context Provider Repository Injection

## Scope

Task 623 extended the customer access context provider to support optional repository injection.

Changed files:

- `src/customerAccess/customerAccessContextProvider.js`
- `tests/customerAccess/customerAccessContextProviderRepositoryInjection.unit.test.js`
- `docs/task-623-customer-access-context-provider-repository-injection-no-db-query-no-migration.md`

This is a runtime + tests + docs slice. It does not connect to a real database.

## Behavior

`buildCustomerAccessContext(input, options)` now supports:

- `options.repository`

When no repository is provided, the Task 618 caller-provided behavior is preserved.

When a repository is provided, the provider calls the repository contract methods:

- `getOrganizationScope(input)`
- `getVerifiedCustomerIdentity(input)`
- `getCaseLinkage(input)`
- `getPublicationState(input)`
- `getCustomerVisibleProjection(input)`

Repository results are composed into the controller-compatible context shape used by the current customer access route/controller chain.

## Fail-closed Rules

The provider fails closed when:

- repository is missing required methods
- a repository method throws
- a repository method returns malformed data
- organization scope is unmatched
- customer identity is unverified
- Case linkage is not linked
- publication is not allowed
- projection is unavailable

Raw errors are not surfaced.

## Explicit Non-goals

Task 623 did not add:

- DB access
- SQL
- migration
- repository implementation
- route/controller/middleware changes
- provider integration
- LINE/SMS/Email/App push behavior
- AI/RAG behavior
- audit writes
- Case/Customer/FSR/appointment mutation

The repository is dependency-injected only, so a future DB-backed implementation can be added in a separate scoped task.

## Safety Rules

Raw phone, raw address, raw LINE id, or scoped channel metadata alone do not authorize customer access.

Forbidden/internal projection fields are stripped, including:

- `internalNote`
- `auditLog`
- `aiRawPayload`
- `internalBillingData`
- raw phone/address/LINE id
- token/secret

`finalAppointmentId` is preserved from the customer-visible projection and is not modified.

## Unit Test Coverage

The unit test covers:

- no repository preserves existing caller-provided behavior
- all-allow repository results map to controller-compatible allow context
- organization scope missing/unmatched fails closed
- identity unverified fails closed
- Case linkage not linked fails closed
- publication not allowed fails closed
- projection unavailable returns no customer-visible data
- missing repository method fails closed
- repository method throw fails closed without raw error leakage
- raw identifiers and internal projection fields do not leak
- `finalAppointmentId` is not modified
- input object is not mutated
- repository object is not mutated

## Invariants Preserved

Task 623 preserves:

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
- `node --test tests/customerAccess/customerAccessContextProviderRepositoryInjection.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessContextProvider.js tests/customerAccess/customerAccessContextProviderRepositoryInjection.unit.test.js docs/task-623-customer-access-context-provider-repository-injection-no-db-query-no-migration.md`
