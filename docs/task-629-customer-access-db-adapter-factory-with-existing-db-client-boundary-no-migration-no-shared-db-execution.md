# Task629 - Customer Access DB Adapter Factory with Existing DB Client Boundary / No Migration / No Shared DB Execution

## Scope

Task629 adds a Customer Access DB adapter factory:

- `src/customerAccess/customerAccessDbAdapter.js`
- `tests/customerAccess/customerAccessDbAdapter.unit.test.js`

The factory composes the Task628 query executor with the Task625/627 read-only repository:

```js
existing or injected db client
-> createCustomerAccessDbQueryExecutor({ dbClient })
-> createCustomerAccessReadOnlyRepository({ queryExecutor })
```

This task does not connect to shared DB, execute SQL, add migrations, change schema, modify middleware/routes/controllers/services/repositories, or touch admin frontend code.

## Adapter Contract

`createCustomerAccessDbAdapter({ dbClient })` returns:

```js
{
  queryExecutor,
  repository
}
```

- `queryExecutor` is created by `createCustomerAccessDbQueryExecutor({ dbClient })`.
- `repository` is created by `createCustomerAccessReadOnlyRepository({ queryExecutor })`.

Factory creation is side-effect free and does not call `dbClient`.

## Fail-closed Behavior

When `dbClient` is missing, throws, returns malformed data, or returns mismatched rows, the repository methods fail closed through the existing query executor and mapper path.

The adapter does not expose raw DB errors.

## Safety Policy

The adapter does not output:

- raw phone
- raw address
- raw LINE user id
- token or secret
- internal note
- audit log
- AI raw payload
- internal billing data
- internal settlement data
- `finalAppointmentId`

It does not modify Field Service Report, appointment, publication, customer identity, or final appointment state.

## Non-goals

Task629 does not:

- import real DB singleton, pool, or connection
- import transaction helpers
- import backend repositories
- import routes, controllers, or middleware
- import provider, LINE, SMS, email, app push, AI, RAG, or vector DB modules
- connect to shared DB
- execute SQL against any DB
- add migrations
- change schema
- add audit runtime
- add permission runtime
- add smoke tests

## Verification

Required targeted checks:

```bash
node --check src/customerAccess/customerAccessDbAdapter.js
node --test tests/customerAccess/customerAccessDbAdapter.unit.test.js
git diff --check -- src/customerAccess/customerAccessDbAdapter.js tests/customerAccess/customerAccessDbAdapter.unit.test.js docs/task-629-customer-access-db-adapter-factory-with-existing-db-client-boundary-no-migration-no-shared-db-execution.md
```

## Future Task Boundary

If future work injects a real DB client, that must be a separate task with explicit scope for:

- exact DB client file
- environment and command policy
- read-only execution command, if any
- rollback and stop conditions
- permission and audit boundary
- no shared runtime execution unless explicitly approved
