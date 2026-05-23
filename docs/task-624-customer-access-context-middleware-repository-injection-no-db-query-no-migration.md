# Task 624 - Customer Access Context Middleware Repository Injection

## Scope

Task 624 extended the customer access context middleware to pass an injected repository to the context provider.

Changed files:

- `src/customerAccess/customerAccessContextMiddleware.js`
- `tests/customerAccess/customerAccessContextMiddlewareRepositoryInjection.unit.test.js`
- `docs/task-624-customer-access-context-middleware-repository-injection-no-db-query-no-migration.md`

This is a runtime + tests + docs slice. It does not connect to a real database.

## Behavior

`buildCustomerAccessContextMiddleware(options)` now accepts:

- `options.repository`

The middleware calls:

- `buildCustomerAccessContext(input, { repository: options.repository })`

When no repository is provided, the Task 619 caller-provided behavior is preserved.

When a synthetic repository is provided, repository results flow through the provider into controller-compatible request fields.

## Fail-closed Rules

The middleware applies fail-closed request context when repository-backed provider output fails closed, including:

- organization unmatched
- identity unverified
- Case linkage not linked
- publication not allowed
- repository method missing
- repository method throws

Repository errors are not thrown to callers and raw error messages are not written to the request output.

## Explicit Non-goals

Task 624 did not add:

- DB access
- SQL
- migration
- repository implementation
- route/controller changes
- production middleware mount changes
- provider integration
- LINE/SMS/Email/App push behavior
- AI/RAG behavior
- audit writes
- smoke tests

The middleware does not import a repository implementation. Repository use is dependency-injected only.

## Safety Rules

Raw phone, raw address, raw LINE id, or scoped channel metadata alone do not authorize customer access.

Forbidden/internal projection fields are filtered before being written to the request, including:

- `internalNote`
- `auditLog`
- `aiRawPayload`
- `internalBillingData`
- raw phone/address/LINE id
- token/secret

`finalAppointmentId` is preserved from the customer-visible projection and is not modified.

## Unit Test Coverage

The unit test covers:

- no repository preserves caller-provided behavior
- all-allow repository results populate controller-compatible request fields
- organization unmatched creates fail-closed request context
- identity unverified creates fail-closed request context
- Case linkage not linked creates fail-closed request context
- publication not allowed creates fail-closed request context
- projection unavailable produces no customer-visible data
- missing repository method creates fail-closed request context
- repository method throw creates fail-closed request context and still calls `next()` once
- raw identifiers and internal fields do not leak into request output
- `finalAppointmentId` is not modified
- unrelated request fields are not mutated
- repository object is not mutated

## Invariants Preserved

Task 624 preserves:

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
- `node --test tests/customerAccess/customerAccessContextMiddlewareRepositoryInjection.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessContextMiddleware.js tests/customerAccess/customerAccessContextMiddlewareRepositoryInjection.unit.test.js docs/task-624-customer-access-context-middleware-repository-injection-no-db-query-no-migration.md`
