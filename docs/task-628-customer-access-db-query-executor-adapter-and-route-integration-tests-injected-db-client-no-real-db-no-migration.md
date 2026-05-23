# Task628 - Customer Access DB Query Executor Adapter and Route Integration Tests / Injected DB Client / No Real DB / No Migration

## Scope

Task628 adds a Customer Access DB query executor adapter:

- `src/customerAccess/customerAccessDbQueryExecutor.js`
- `tests/customerAccess/customerAccessDbQueryExecutor.unit.test.js`
- `tests/customerAccess/customerAccessRouteDbExecutorIntegration.unit.test.js`

This is a bounded runtime slice that uses an injected synthetic `dbClient` only. It does not connect to a real database, execute shared runtime SQL, add migrations, change schema, modify routes, alter controllers, or touch existing repository/middleware files.

## Adapter Contract

`createCustomerAccessDbQueryExecutor({ dbClient })` returns a synchronous query executor compatible with the Task627 repository `queryExecutor` path.

The selected `dbClient` contract is:

```js
{
  query(statementSql, statementParams) {
    return { rows: [row] };
  }
}
```

The executor:

- accepts only parameterized query specs
- does not execute anything when `querySpec.executable === false`
- does not call the client when required params are missing
- calls the injected client with static SQL from the query spec and resolved parameter values
- maps returned rows into the row bundle expected by the Task626 mapper
- returns `{}` to fail closed on missing client, non-executable spec, missing statements, malformed result, client throw, or unknown statement key

## Row Bundle Policy

The executor only emits row bundle keys consumed by the Task626 mapper:

- `caseRow`
- `customerIdentityRow`
- `publicationRow`
- `serviceReportRow`

It allow-lists row fields and does not output raw phone, raw address, raw LINE user id, token, secret, internal error, internal note, audit log, internal billing data, internal settlement data, AI raw payload, or `finalAppointmentId`.

## Route Integration Test

The route integration test uses:

- synthetic router
- synthetic response object
- injected synthetic `dbClient`
- `createCustomerAccessDbQueryExecutor({ dbClient })`
- existing `registerCustomerAccessRoutes(router, { queryExecutor })`

No server is started. No real database is used. No provider is called.

## Non-goals

Task628 does not:

- import a real DB client
- import a transaction helper
- import backend repositories
- modify `src/db/`
- modify routes or controllers
- modify middleware or read-only repository
- add migrations or schema changes
- execute shared DB SQL
- write audit logs
- alter Field Service Report, appointment, publication, or customer identity rows
- send LINE, SMS, email, app push, or provider calls
- implement AI, RAG, vector, billing, entitlement, usage, or Enterprise SSO runtime

## Verification

Required targeted checks:

```bash
node --check src/customerAccess/customerAccessDbQueryExecutor.js
node --test tests/customerAccess/customerAccessDbQueryExecutor.unit.test.js
node --test tests/customerAccess/customerAccessRouteDbExecutorIntegration.unit.test.js
git diff --check -- src/customerAccess/customerAccessDbQueryExecutor.js tests/customerAccess/customerAccessDbQueryExecutor.unit.test.js tests/customerAccess/customerAccessRouteDbExecutorIntegration.unit.test.js docs/task-628-customer-access-db-query-executor-adapter-and-route-integration-tests-injected-db-client-no-real-db-no-migration.md
```

## Future Task Boundary

Connecting this adapter to a real DB client must be a separate task with explicit approval and scope. That future task must define the exact file, environment, read-only query behavior, timeout behavior, permission boundary, audit policy, test plan, and whether any local-only DB command is allowed.
