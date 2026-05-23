# Task 640 - Customer Access DB Client Factory Boundary / Injected Connector / No Shared DB / No Migration

## Summary

Task 640 adds a Customer Access DB client factory boundary. It supports only injected connector contracts and read-only config. This prepares future server/env integration without reading real environment variables, connecting to shared DB, or creating a production DB client in this task.

This task does not read `process.env`, does not connect to DB, does not execute SQL, does not change `server.js`, and does not modify migrations, schema, smoke tests, admin frontend files, package metadata, providers, AI, or RAG runtime.

## Files

- `src/customerAccess/customerAccessDbClientFactory.js`
- `tests/customerAccess/customerAccessDbClientFactory.unit.test.js`
- `docs/task-640-customer-access-db-client-factory-boundary-injected-connector-no-shared-db-no-migration.md`

## Factory Contract

Exports:

- `createCustomerAccessDbClientFactory(options)`
- `buildCustomerAccessDbClient(options)`

Supported injected connector contracts:

```js
{
  connector: {
    createReadOnlyClient(config) {}
  },
  config: {
    readOnly: true
  }
}
```

or:

```js
{
  createReadOnlyClient(config) {},
  config: {
    readOnly: true
  }
}
```

Success output:

```js
{
  enabled: true,
  dbClient,
  safeSummary: {
    enabled: true,
    readOnly: true,
    hasQuery: true
  }
}
```

Fail-closed output:

```js
{
  enabled: false,
  dbClient: null,
  safeSummary: {
    enabled: false,
    readOnly: false,
    hasQuery: false
  }
}
```

## Safety Rules

The factory:

- Requires `config.readOnly === true`.
- Does not call the connector until `buildCustomerAccessDbClient()` or `factory.build()` is explicitly called.
- Verifies returned client has a `query` function.
- Fail-closes on missing connector, missing config, non-read-only config, connector throw, or malformed client.
- Does not mutate input config or connector objects.
- Does not log anything.
- Does not expose connection strings, DB URLs, passwords, tokens, secrets, raw phone, raw address, or raw LINE identifiers in safe summaries or fail-closed results.

## Security Boundary

The factory does not:

- Read `process.env`.
- Import app, server, DB, transaction, repository, provider, AI, or RAG modules.
- Connect to DB.
- Execute SQL.
- Write audit logs.
- Send notifications.

## Future Server / Env Integration Boundary

Future work that uses a real connector must be a separate bounded task. It should explicitly define:

- Exact connector file.
- Exact allowed env keys.
- DB client lifecycle.
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

- `node --check src/customerAccess/customerAccessDbClientFactory.js`
- `node --test tests/customerAccess/customerAccessDbClientFactory.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessDbClientFactory.js tests/customerAccess/customerAccessDbClientFactory.unit.test.js docs/task-640-customer-access-db-client-factory-boundary-injected-connector-no-shared-db-no-migration.md`
