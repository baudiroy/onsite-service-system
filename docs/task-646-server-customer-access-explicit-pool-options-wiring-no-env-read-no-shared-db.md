# Task 646 - Server Customer Access Explicit Pool Options Wiring / No Env Read / No Shared DB

## Summary

Task 646 extends `src/server.js` so callers may explicitly pass Customer Access DB objects through server bootstrap options:

```js
{
  customerAccessPool,
  customerAccessDb,
  customerAccessDbClientConfig,
  env,
  customerAccess
}
```

The server converts those explicit options into a `customerAccessComposer` input and reuses the existing composer path. This task does not read real `process.env`, does not create a pool, does not connect to shared DB, does not execute SQL during bootstrap, does not add migrations, and does not change schema or routes.

## Files

- `src/server.js`
- `tests/customerAccess/customerAccessServerExplicitPoolOptions.unit.test.js`
- `docs/task-646-server-customer-access-explicit-pool-options-wiring-no-env-read-no-shared-db.md`

## Priority

Server bootstrap priority is:

1. `options.app`
2. `options.customerAccessBootstrap`
3. `options.customerAccessComposer`
4. Explicit `options.customerAccessPool` / `options.customerAccessDb` composer path
5. `options.env`
6. Default app

`options.app` remains highest priority and bypasses all Customer Access bootstrap, composer, env, pool, and db options.

## Explicit Pool / DB Composer Input

When no higher-priority Customer Access option is present and either `customerAccessPool` or `customerAccessDb` is supplied, server builds composer input:

```js
{
  env: options.env,
  pool: options.customerAccessPool,
  db: options.customerAccessDb,
  dbClientConfig: options.customerAccessDbClientConfig,
  customerAccess: options.customerAccess
}
```

The composer remains responsible for read-only gating and DB client generation. `readOnly: true` is required before a generated query client can exist.

## Runtime Boundary

The server:

- Does not read real `process.env` for Customer Access DB wiring.
- Does not create a DB pool.
- Does not call `pool.query` or `db.query` in server bootstrap.
- Does not execute SQL during bootstrap.
- Does not directly import Customer Access DB adapter, query executor, read-only repository, or read-only connector.
- Does not directly import real DB singleton, transaction helper, repositories, provider, LINE, SMS, Email, App push, AI, RAG, or vector modules.
- Does not log DB URL, token, secret, raw phone, raw address, or raw LINE id.
- Does not enable the direct-run server Customer Access DB path automatically.

## Test Coverage

The unit test covers:

- `options.app` priority over explicit pool/db options.
- `customerAccessBootstrap` priority over explicit pool/db options.
- `customerAccessComposer` priority over explicit pool/db options.
- Pool/db options create the composer path when no higher-priority options exist.
- Bootstrap creation does not call `pool.query` or `db.query`.
- `readOnly: true` + pool + env DB enabled returns the synthetic allow path.
- `readOnly: false` + pool + env DB enabled returns generic safe-deny and does not query pool.
- Pool query throw during request returns generic safe-deny with no raw error leak.
- Caller-provided `customerAccess.repository` priority over generated pool client.
- Env disabled + pool does not query pool and safe-denies.
- Responses do not leak token, secret, DB URL, raw phone, raw address, raw LINE id, internal fields, SQL fragments, or final appointment ids.
- Server module does not directly import restricted Customer Access DB modules or real DB/provider/AI modules.
- `startServer({ customerAccessPool, app })` uses injected app priority and only listens when explicitly called.

## Future Real Pool / Env Lifecycle Boundary

Future work that wires a real pool/provider must be a separate bounded task. It must define:

- Exact pool provider.
- Exact env keys.
- DB lifecycle and shutdown behavior.
- Read-only role expectations.
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

- `node --check src/server.js`
- `node --test tests/customerAccess/customerAccessServerExplicitPoolOptions.unit.test.js`
- `git diff --check -- src/server.js tests/customerAccess/customerAccessServerExplicitPoolOptions.unit.test.js docs/task-646-server-customer-access-explicit-pool-options-wiring-no-env-read-no-shared-db.md`
