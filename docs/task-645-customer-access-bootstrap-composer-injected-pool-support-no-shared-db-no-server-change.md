# Task 645 - Customer Access Bootstrap Composer Injected Pool Support / No Shared DB / No Server Change

## Summary

Task 645 extends `composeCustomerAccessBootstrap(input)` so callers may provide an injected `pool` or `db` object. When DB support is enabled and `dbClientConfig.readOnly === true`, the composer wraps that injected object with the Task 644 read-only connector and passes it through the existing Task 640 DB client factory.

This task does not modify `server.js`, does not read `process.env`, does not connect to shared DB, does not execute real SQL, does not add migrations, and does not change schema, routes, providers, smoke tests, admin frontend files, package metadata, AI, or RAG runtime.

## Files

- `src/customerAccess/customerAccessBootstrapComposer.js`
- `tests/customerAccess/customerAccessBootstrapComposerPoolSupport.unit.test.js`
- `docs/task-645-customer-access-bootstrap-composer-injected-pool-support-no-shared-db-no-server-change.md`

## Composition Contract

The composer now accepts:

```js
{
  env,
  connector,
  pool,
  db,
  dbClientConfig,
  customerAccess
}
```

Generated DB client priority remains conservative:

1. Caller-provided `customerAccess.repository`.
2. Caller-provided `customerAccess.dbAdapter`.
3. Caller-provided `customerAccess.queryExecutor`.
4. Caller-provided `customerAccess.dbClient`.
5. Explicit `connector`.
6. Injected `pool` or `db` wrapped by the read-only DB connector.
7. No generated DB client.

## Runtime Boundary

The composer:

- Uses an explicit connector when provided.
- Falls back to an injected `pool` or `db` only when no explicit connector exists.
- Requires env DB flag enabled and `dbClientConfig.readOnly === true` before generating a DB client.
- Does not call `pool.query` or `db.query` while composing.
- Does not manage DB lifecycle.
- Does not import the real DB singleton.
- Does not read `process.env`.
- Does not log SQL, params, DB URL, token, secret, raw phone, raw address, or raw LINE id.
- Does not mutate input, env, config, pool, db, or `customerAccess`.

## Test Coverage

The unit test covers:

- Pool/db support without breaking the explicit connector path.
- Explicit connector priority over pool/db.
- DB flag enabled + pool + `readOnly: true` generates a DB client.
- DB flag enabled + db + `readOnly: true` generates a DB client.
- `readOnly: false` does not generate a DB client and does not query pool/db.
- DB flag disabled does not generate a DB client and does not query pool/db.
- Pool query is not called during compose and is only used by a future query path.
- Caller-provided repository, dbAdapter, queryExecutor, and dbClient priority over generated pool/db client.
- Malformed pool/db without query produces no DB client.
- Pool throw during future query path returns a generic safe error without secret leakage.
- Output excludes connection string, token, secret, password, raw phone, raw address, and raw LINE id.
- Input objects are not mutated.
- No logging side effects.
- Module import boundary: no `process.env`, server, app, real DB singleton, transaction, repository, provider, AI, or RAG imports.

## Future Real DB / Server Integration Boundary

Future server integration that uses a real pool must be a separate bounded task. It must define:

- Exact pool provider.
- Exact env keys.
- Read-only DB role expectations.
- DB client lifecycle and shutdown behavior.
- No secret logging.
- Allowed tests.
- No shared DB boundary, or explicit disposable DB authorization.
- Provider, notification, AI, and RAG runtime exclusions.

## Preserved Product Guardrails

- One Case equals one formal Field Service Report for the onsite service workflow.
- Customer-facing reports remain filtered publication views.
- LINE user identifiers are not global identities.
- Organization isolation and Data Access Control remain required.
- Internal notes, audit logs, AI raw payloads, billing internals, settlement internals, raw channel identifiers, DB URL, token, and secret must not leak through customer access.
- Future SaaS entitlement, usage, AI Add-on, billing, Enterprise SSO, and provider integrations remain unchanged.

## Verification

Expected targeted checks:

- `node --check src/customerAccess/customerAccessBootstrapComposer.js`
- `node --test tests/customerAccess/customerAccessBootstrapComposerPoolSupport.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessBootstrapComposer.js tests/customerAccess/customerAccessBootstrapComposerPoolSupport.unit.test.js docs/task-645-customer-access-bootstrap-composer-injected-pool-support-no-shared-db-no-server-change.md`
