# Task 641 - Customer Access Bootstrap Composition Helper / Injected Env and Connector / No Shared DB / No Server Change

## Summary

Task 641 adds a Customer Access bootstrap composition helper. It composes caller-provided env-like input, optional injected connector/config, and optional higher-priority Customer Access runtime options into sanitized `customerAccessBootstrap` output.

This task does not read `process.env`, does not modify `server.js`, does not connect to DB, does not execute SQL, and does not change migrations, schema, smoke tests, admin frontend files, package metadata, providers, AI, or RAG runtime.

## Files

- `src/customerAccess/customerAccessBootstrapComposer.js`
- `tests/customerAccess/customerAccessBootstrapComposer.unit.test.js`
- `docs/task-641-customer-access-bootstrap-composition-helper-injected-env-and-connector-no-shared-db-no-server-change.md`

## Composition Contract

Export:

- `composeCustomerAccessBootstrap(input)`

Input shape:

```js
{
  env,
  connector,
  dbClientConfig,
  customerAccess
}
```

Rules:

- `env` is caller-provided env-like input, not `process.env`.
- `connector` is an injected DB connector.
- `dbClientConfig` is caller-provided DB client config.
- `customerAccess` is caller-provided higher-priority runtime options.
- Caller-provided `repository`, `dbAdapter`, `queryExecutor`, or `dbClient` take priority over generated DB client.
- `CUSTOMER_ACCESS_DB_ENABLED=true` plus valid connector/config with `readOnly: true` can generate a DB client through Task 640 factory.
- If DB client creation fails, output remains enabled if Customer Access env is enabled, but no `dbClient` is emitted.

Enabled output:

```js
{
  enabled: true,
  customerAccessBootstrap: {
    enabled: true,
    customerAccess: {
      enabled: true,
      dbClient
    }
  },
  safeSummary: {
    enabled: true,
    readOnlyEnabled: true,
    dbEnabled: true,
    hasGeneratedDbClient: true,
    hasRepository: false,
    hasDbAdapter: false,
    hasQueryExecutor: false,
    hasDbClient: true
  }
}
```

Disabled output:

```js
{
  enabled: false,
  customerAccessBootstrap: {
    enabled: false
  },
  safeSummary: {
    enabled: false,
    readOnlyEnabled: false,
    dbEnabled: false,
    hasGeneratedDbClient: false,
    hasRepository: false,
    hasDbAdapter: false,
    hasQueryExecutor: false,
    hasDbClient: false
  }
}
```

## Security Boundary

The composer does not:

- Read `process.env`.
- Import app, server, real DB, transaction, repository, provider, AI, or RAG modules.
- Import Customer Access DB adapter, query executor, or read-only repository directly.
- Connect to DB.
- Execute SQL.
- Write audit logs.
- Send notifications.
- Log anything.
- Output DB URLs, tokens, secrets, customer mobile data, raw addresses, raw LINE identifiers, or full payloads.

## Future Server Integration Boundary

Future server integration must be a separate bounded task. It should explicitly define:

- Exact server file.
- Real env boundary.
- DB lifecycle.
- Read-only execution behavior.
- No secret logging.
- Targeted tests.
- No shared DB or DDL execution unless explicitly authorized.
- Provider and AI runtime exclusions.

## Preserved Product Guardrails

- One Case equals one formal Field Service Report for the onsite service workflow.
- Customer-facing reports remain filtered publication views.
- LINE user identifiers are not global identities.
- Organization isolation and Data Access Control remain required.
- Internal notes, audit logs, AI raw payloads, billing internals, settlement internals, and raw channel identifiers must not leak through customer access.
- Future SaaS entitlement, usage, AI Add-on, billing, Enterprise SSO, and provider integrations remain unchanged.

## Verification

Expected targeted checks:

- `node --check src/customerAccess/customerAccessBootstrapComposer.js`
- `node --test tests/customerAccess/customerAccessBootstrapComposer.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessBootstrapComposer.js tests/customerAccess/customerAccessBootstrapComposer.unit.test.js docs/task-641-customer-access-bootstrap-composition-helper-injected-env-and-connector-no-shared-db-no-server-change.md`
