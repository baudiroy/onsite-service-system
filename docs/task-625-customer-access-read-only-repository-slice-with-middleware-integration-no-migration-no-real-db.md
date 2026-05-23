# Task 625 - Customer Access Read-only Repository Slice with Middleware Integration

## Scope

Task 625 is a medium bounded runtime slice. It adds a read-only repository implementation backed only by injected synthetic `readModel` / `dataProvider`, and wires middleware/route options so tests can exercise repository-backed customer access without a real database.

Changed files:

- `src/customerAccess/customerAccessReadOnlyRepository.js`
- `src/customerAccess/customerAccessContextMiddleware.js`
- `src/routes/customerAccessRoutes.js`
- `tests/customerAccess/customerAccessReadOnlyRepository.unit.test.js`
- `tests/customerAccess/customerAccessRouteRepositoryIntegration.unit.test.js`
- `docs/task-625-customer-access-read-only-repository-slice-with-middleware-integration-no-migration-no-real-db.md`

## Read-only Repository

`createCustomerAccessReadOnlyRepository(options)` supports:

- `options.readModel`
- `options.dataProvider`

It implements the customer access repository contract:

- `getOrganizationScope(input)`
- `getVerifiedCustomerIdentity(input)`
- `getCaseLinkage(input)`
- `getPublicationState(input)`
- `getCustomerVisibleProjection(input)`

The implementation is read-only, deterministic, and side-effect free. It does not import DB clients, transactions, existing repositories, providers, AI, routes, controllers, or middleware.

## Middleware / Route Integration

`buildCustomerAccessContextMiddleware(options)` now supports:

- `options.repository`
- `options.readModel`
- `options.dataProvider`

Explicit `options.repository` has priority. If no repository is provided but `readModel` or `dataProvider` exists, middleware creates a read-only repository for the provider.

`registerCustomerAccessRoutes(router, options)` now passes options into the middleware builder while preserving:

- `GET /customer-access/:caseId`
- no route index change
- no controller change
- no app/server bootstrap change

When route index calls without options, behavior remains fail-closed / caller-provided.

## Fail-closed and Filtering

The repository and route integration fail closed for:

- missing readModel / provider
- provider throw
- malformed result
- organization unmatched
- identity unverified
- Case not linked
- publication not allowed
- projection unavailable

Customer-visible projection strips forbidden/internal fields including:

- `internalNote`
- `auditLog`
- `aiRawPayload`
- `internalBillingData`
- `internalSettlementData`
- raw phone/address/LINE id
- token/secret

Raw phone, raw address, and raw LINE id alone do not verify identity.

`finalAppointmentId` is preserved and not modified.

## Tests

Read-only repository unit coverage:

- exports repository factory
- missing readModel fail-closes all methods
- all-allow readModel returns allow pieces
- organization unmatched returns unmatched
- identity unverified returns unverified
- case not linked returns not linked
- publication not allowed returns not allowed
- projection unavailable returns empty unavailable data
- raw identifiers do not verify identity
- forbidden/internal fields stripped from projection
- provider/readModel throw or malformed result fails closed
- input and readModel are not mutated
- `finalAppointmentId` is not modified
- module has no imports

Route integration coverage:

- `registerCustomerAccessRoutes(router, { readModel })` registers `GET /customer-access/:caseId`
- all-allow readModel returns HTTP `200` allow envelope
- allow response includes customer-visible service report data
- forbidden/internal fields stripped
- organization unmatched returns generic safe-deny `404`
- identity unverified returns generic safe-deny `404`
- case not linked returns generic safe-deny `404`
- publication not allowed returns generic safe-deny `404`
- projection unavailable returns generic safe-deny
- provider throw returns generic safe-deny without raw error leakage
- response never exposes raw phone/address/LINE id
- `finalAppointmentId` is not modified

## Explicit Non-goals

Task 625 did not add:

- real DB access
- SQL
- migration
- schema/index change
- provider/LINE/SMS/Email/App push integration
- AI/RAG behavior
- audit runtime
- route index changes
- controller changes
- app/server bootstrap changes
- smoke tests
- admin frontend changes

## Invariants Preserved

Task 625 preserves:

- one Case = one formal Field Service Report
- customer-facing report is a filtered publication view
- LINE user id is not a global identity
- organization isolation and Data Access Control remain required
- no internal data leakage
- no AI auto decision
- no sensitive output

## Verification

Planned verification:

- `node --check src/customerAccess/customerAccessReadOnlyRepository.js`
- `node --check src/customerAccess/customerAccessContextMiddleware.js`
- `node --check src/routes/customerAccessRoutes.js`
- `node --test tests/customerAccess/customerAccessReadOnlyRepository.unit.test.js`
- `node --test tests/customerAccess/customerAccessRouteRepositoryIntegration.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessReadOnlyRepository.js src/customerAccess/customerAccessContextMiddleware.js src/routes/customerAccessRoutes.js tests/customerAccess/customerAccessReadOnlyRepository.unit.test.js tests/customerAccess/customerAccessRouteRepositoryIntegration.unit.test.js docs/task-625-customer-access-read-only-repository-slice-with-middleware-integration-no-migration-no-real-db.md`

## Future Task Recommendation

Future work should be a separate scoped task. Candidate next steps:

- add a DB-backed read-only repository behind the same contract
- add permission/audit boundary tests for DB-backed lookup
- add a narrow integration smoke only after DB access is explicitly authorized
