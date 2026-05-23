# Task 639 - Server Customer Access Env Options Wiring / No DB Client Creation / No Shared DB

## Summary

Task 639 adds caller-provided env-like object support to `src/server.js` for Customer Access bootstrap. The server can now derive a sanitized Customer Access bootstrap input from `options.env` and route it through the existing Task 637 bootstrap plan and app adapter path.

This task does not directly read `process.env`, does not create a DB client, does not connect to a real DB, does not execute SQL, and does not change migrations, schema, smoke tests, admin frontend files, package metadata, providers, AI, or RAG runtime.

## Files

- `src/server.js`
- `tests/customerAccess/customerAccessServerEnvOptions.unit.test.js`
- `docs/task-639-server-customer-access-env-options-wiring-no-db-client-creation-no-shared-db.md`

## Server Env Options Contract

`resolveServerApp(options)` now follows this priority:

1. If `options.app` exists, use the injected app.
2. If `options.customerAccessBootstrap` exists, use the explicit Customer Access bootstrap input.
3. If `options.env` exists, call `buildCustomerAccessBootstrapInputFromEnv(options.env)` and route the result through the existing bootstrap plan path.
4. If none are present, use the default app.

`options.env` must be explicitly provided by the caller. Direct-run server behavior does not read environment variables to enable Customer Access.

When env enables Customer Access without a DB client, the server creates a Customer Access route surface with a no-op adapter path that remains generic safe-deny. `CUSTOMER_ACCESS_DB_ENABLED=true` is treated only as a safe future flag and does not create or call a DB client.

## Security Boundary

The server imports `./customerAccess/customerAccessEnvBoundary` but does not directly import:

- Customer Access DB adapter.
- Customer Access DB query executor.
- Customer Access read-only repository.
- Real DB singleton, pool, or connection for bootstrap creation.
- Transaction helper.
- Repositories.
- Providers, LINE, SMS, email, App push.
- AI or RAG modules.

The direct-run shutdown path still lazily loads the existing PostgreSQL pool only when shutdown needs to close it.

## Tests

The targeted unit test covers:

- `options.app` priority over env.
- Explicit `customerAccessBootstrap` priority over env.
- Missing env uses default app.
- Env `CUSTOMER_ACCESS_ENABLED=true` creates a Customer Access enabled safe-deny app without DB client.
- Env `CUSTOMER_ACCESS_DB_ENABLED=true` does not create or call DB.
- Env containing DB URL, token, secret, raw phone, raw address, or raw LINE id does not leak into response.
- False env values keep default safe-deny behavior.
- Direct-run behavior remains guarded by `require.main === module`.
- Server does not directly read `process.env`.
- Server imports env boundary but no restricted DB, repository, provider, AI, or RAG modules.
- `startServer({ env, app })` still uses injected app priority and listens only when explicitly called.

## Future Real Env / DB Lifecycle Boundary

Future work that reads real environment variables or creates a real DB client must be a separate bounded task. It must explicitly define:

- Exact allowed env keys.
- DB client creation and lifecycle.
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

- `node --check src/server.js`
- `node --test tests/customerAccess/customerAccessServerEnvOptions.unit.test.js`
- `git diff --check -- src/server.js tests/customerAccess/customerAccessServerEnvOptions.unit.test.js docs/task-639-server-customer-access-env-options-wiring-no-db-client-creation-no-shared-db.md`
