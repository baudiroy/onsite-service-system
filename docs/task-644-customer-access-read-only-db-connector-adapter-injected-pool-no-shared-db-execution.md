# Task 644 - Customer Access Read-Only DB Connector Adapter / Injected Pool / No Shared DB Execution

## Summary

Task 644 adds a Customer Access read-only DB connector adapter. The adapter wraps a caller-provided `pool` or `db` object into the existing `createReadOnlyClient(config)` connector contract used by the Customer Access bootstrap composition path.

This task does not import the real DB singleton, does not read `process.env`, does not connect to shared DB, does not execute real SQL, does not add migrations, and does not modify server/app/route wiring.

## Files

- `src/customerAccess/customerAccessReadOnlyDbConnector.js`
- `tests/customerAccess/customerAccessReadOnlyDbConnector.unit.test.js`
- `docs/task-644-customer-access-read-only-db-connector-adapter-injected-pool-no-shared-db-execution.md`

## Connector Contract

The adapter exports:

```js
createCustomerAccessReadOnlyDbConnector(options)
```

`options` may include an injected `pool`, injected `db`, and optional `allowedStatementNames`.

The connector exposes:

```js
{
  createReadOnlyClient(config)
}
```

`createReadOnlyClient(config)` only returns a query client when:

- A caller-provided `pool.query` or `db.query` exists.
- `config.readOnly === true`.
- Optional statement metadata is allowed when `allowedStatementNames` is configured.

Otherwise it fail-closes by returning `null`.

## Query Wrapper Behavior

The returned client exposes:

```js
{
  query(sql, params)
}
```

The query wrapper:

- Accepts only non-empty SQL strings.
- Accepts only array params.
- Passes a params copy to the injected query target.
- Does not rewrite SQL.
- Does not do string interpolation.
- Does not mutate caller params.
- Does not mutate the injected pool/db object.
- Does not log SQL, params, DB URL, token, secret, raw phone, raw address, raw LINE id, or raw provider errors.
- Converts injected query failures into a controlled generic error message.

## Security Boundary

The adapter:

- Does not import the real DB singleton.
- Does not import transaction helpers.
- Does not import repositories.
- Does not import server, app, route, or controller modules.
- Does not import provider, LINE, SMS, Email, App push, AI, RAG, or vector modules.
- Does not read `process.env`.
- Does not create a DB pool.
- Does not call `pool.query` or `db.query` at factory creation or client creation time.
- Does not write audit logs or emit logs.

## Test Coverage

The unit test covers:

- Exported factory function.
- Missing pool/db fail-closed behavior.
- `readOnly !== true` fail-closed behavior without pool/db calls.
- Valid injected pool returns a query client.
- Client creation does not query the injected pool/db.
- Query forwards SQL and copied params to a synthetic pool.
- Empty SQL rejection.
- Non-array params rejection.
- Injected pool throw returns a safe generic error without leaking DB URL, token, or secret.
- Raw phone, raw address, and raw LINE id are not logged or returned.
- Params array is not mutated.
- Pool object is not mutated.
- Optional allowed statement metadata check.
- No logging side effects.
- Static import boundary: no `process.env`, real DB, transaction, repository, server, provider, AI, or RAG imports.

## Future Real DB Integration Boundary

Future work that connects this adapter to a real DB provider must be a separate bounded task. That task must define:

- Exact allowed pool provider.
- Exact env keys.
- Read-only DB role expectations.
- DB client lifecycle.
- Disposable DB or explicit no-shared-DB boundary.
- Verification commands.
- No secret logging.
- Provider and AI runtime exclusions.

## Preserved Product Guardrails

- One Case equals one formal Field Service Report for the onsite service workflow.
- Customer-facing reports remain filtered publication views.
- LINE user identifiers are not global identities.
- Organization isolation and Data Access Control remain required.
- Internal notes, audit logs, AI raw payloads, billing internals, settlement internals, raw channel identifiers, DB URL, token, and secret must not leak through customer access.
- Future SaaS entitlement, usage, AI Add-on, billing, Enterprise SSO, and provider integrations remain unchanged.

## Verification

Expected targeted checks:

- `node --check src/customerAccess/customerAccessReadOnlyDbConnector.js`
- `node --test tests/customerAccess/customerAccessReadOnlyDbConnector.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessReadOnlyDbConnector.js tests/customerAccess/customerAccessReadOnlyDbConnector.unit.test.js docs/task-644-customer-access-read-only-db-connector-adapter-injected-pool-no-shared-db-execution.md`
