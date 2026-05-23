# Task626 - Customer Access DB Row Mapper and Query Spec / No DB Execution / No Migration

## Scope

Task626 adds a pre-DB execution layer for the customer access read-only path:

- `src/customerAccess/customerAccessDbReadModelMapper.js`
- `tests/customerAccess/customerAccessDbReadModelMapper.unit.test.js`

This task does not modify routes, controllers, middleware, repositories, services, database helpers, migrations, admin frontend code, package scripts, smoke tests, fixtures, or runtime bootstrap files.

## Runtime Decision

No runtime behavior is mounted or connected in Task626.

The new mapper is pure and deterministic. It converts a synthetic DB row bundle into the Task625 readModel shape used by the existing read-only customer access repository contract. It does not open a database connection, execute SQL, create transactions, send notifications, call providers, invoke AI, read vector indexes, or write audit records.

## Mapper Contract

`mapCustomerAccessDbRowsToReadModel(input)` accepts synthetic rows:

- `caseRow`
- `customerIdentityRow`
- `publicationRow`
- `serviceReportRow`

It returns a readModel containing:

- `organizationScope`
- `customerIdentity`
- `caseLinkage`
- `publication`
- `customerVisibleProjection`

The mapper fails closed for missing input, missing case row, organization mismatch, customer mismatch, missing customer linkage, unverified identity, unpublished state, failed customer-visible policy, or missing customer-visible service report projection.

## Safe Projection Policy

The customer-visible projection intentionally allows only minimal service report fields:

- `publicReportId`
- `status`

It does not expose `finalAppointmentId`, raw phone, raw address, raw LINE user id, token, secret, internal note, audit log, AI raw payload, internal billing data, or internal settlement data.

Task626 does not modify `finalAppointmentId` and does not include it in the mapper output.

## Query Spec Contract

`buildCustomerAccessReadModelQuerySpec(input)` returns a static, parameterized query specification only:

- `name`
- `executable`
- `params`
- `requiredParams`
- `statements`

Required params are:

- `organizationId`
- `caseId`
- `customerId`

Raw phone, raw address, and raw LINE user id are not required authorization params and are not included in the query spec. SQL text uses placeholders and does not interpolate untrusted input. Missing required params set `executable: false`.

## Non-goals

Task626 does not:

- execute SQL
- add migrations
- modify DB schema
- connect a DB client
- add transaction helpers
- alter customer access routes or middleware
- alter the read-only repository from Task625
- alter controllers or services
- send LINE, SMS, email, app push, or provider calls
- implement AI, RAG, or vector retrieval
- write audit logs
- expose customer PII or sensitive payloads

## Verification

Required targeted checks:

```bash
node --check src/customerAccess/customerAccessDbReadModelMapper.js
node --test tests/customerAccess/customerAccessDbReadModelMapper.unit.test.js
git diff --check -- src/customerAccess/customerAccessDbReadModelMapper.js tests/customerAccess/customerAccessDbReadModelMapper.unit.test.js docs/task-626-customer-access-db-row-mapper-and-query-spec-no-db-execution-no-migration.md
```
