# Task 638 - Customer Access Env Boundary Helper and Unit Tests / No process.env Read / No DB Client Creation

## Summary

Task 638 adds a pure Customer Access env boundary helper. The helper converts a caller-provided env-like object into sanitized Customer Access bootstrap input and safe summary metadata.

This task does not read `process.env`, does not create a DB client, does not connect to DB, does not execute SQL, does not change `server.js`, and does not modify migrations, schema, smoke tests, admin frontend files, package metadata, providers, AI, or RAG runtime.

## Files

- `src/customerAccess/customerAccessEnvBoundary.js`
- `tests/customerAccess/customerAccessEnvBoundary.unit.test.js`
- `docs/task-638-customer-access-env-boundary-helper-and-unit-tests-no-process-env-read-no-db-client-creation.md`

## Env Boundary Contract

Exports:

- `buildCustomerAccessBootstrapInputFromEnv(envLike)`
- `sanitizeCustomerAccessEnv(envLike)`

Behavior:

- Accepts only caller-provided env-like objects.
- Fails closed by default.
- Does not read `process.env`.
- Supports non-secret feature flags:
  - `CUSTOMER_ACCESS_ENABLED`
  - `CUSTOMER_ACCESS_READ_ONLY_ENABLED`
  - `CUSTOMER_ACCESS_DB_ENABLED`
- Treats only explicit allow values as enabled: `true`, `1`, `yes`, `on`, or boolean `true`.
- Keeps `CUSTOMER_ACCESS_DB_ENABLED` as a safe future feature flag only.
- Does not output DB URLs, tokens, secrets, passwords, raw phone, raw address, raw LINE identifiers, or env raw dumps.
- Does not mutate input.

Enabled output shape:

```js
{
  enabled: true,
  customerAccess: {
    enabled: true
  },
  safeSummary: {
    enabled: true,
    readOnlyEnabled: true,
    dbEnabled: false
  }
}
```

Disabled output shape:

```js
{
  enabled: false,
  customerAccess: {
    enabled: false
  },
  safeSummary: {
    enabled: false,
    readOnlyEnabled: false,
    dbEnabled: false
  }
}
```

## Security Boundary

The helper does not:

- Read `process.env`.
- Import app, server, DB, transaction, repository, provider, AI, or RAG modules.
- Create a DB client.
- Execute SQL.
- Write audit logs.
- Log anything.
- Output DB URLs, tokens, secrets, customer mobile data, raw addresses, raw LINE identifiers, or full payloads.

## Future Server Integration Boundary

Future work that reads real environment variables must be a separate bounded task. It should explicitly define:

- Exact allowed env keys.
- No secret logging.
- DB client lifecycle, if any.
- Read-only execution behavior.
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

- `node --check src/customerAccess/customerAccessEnvBoundary.js`
- `node --test tests/customerAccess/customerAccessEnvBoundary.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessEnvBoundary.js tests/customerAccess/customerAccessEnvBoundary.unit.test.js docs/task-638-customer-access-env-boundary-helper-and-unit-tests-no-process-env-read-no-db-client-creation.md`
