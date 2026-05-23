# Task 642 - Server Customer Access Composer Integration / Injected Env and Connector / No Shared DB

## Summary

Task 642 integrates the Customer Access bootstrap composer into `src/server.js`. Server bootstrap can now accept explicit `options.customerAccessComposer` input and route the composed `customerAccessBootstrap` through the existing server bootstrap plan and app adapter path.

This task does not read real `process.env`, does not connect to shared DB, does not execute SQL, and does not change migrations, schema, smoke tests, admin frontend files, package metadata, providers, AI, or RAG runtime.

## Files

- `src/server.js`
- `tests/customerAccess/customerAccessServerComposerIntegration.unit.test.js`
- `docs/task-642-server-customer-access-composer-integration-injected-env-and-connector-no-shared-db.md`

## Server Composer Integration Contract

Server app resolution priority:

1. `options.app`
2. `options.customerAccessBootstrap`
3. `options.customerAccessComposer`
4. `options.env`
5. default app

`options.customerAccessComposer` must be explicitly provided by the caller. It may contain:

- `env`
- `connector`
- `dbClientConfig`
- `customerAccess`

The server calls `composeCustomerAccessBootstrap(options.customerAccessComposer)`, then passes the composed `customerAccessBootstrap` through the existing Task 637 bootstrap plan path.

## Security Boundary

The server imports `./customerAccess/customerAccessBootstrapComposer` but still does not directly import:

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

- `options.app` priority over composer.
- Explicit `customerAccessBootstrap` priority over composer.
- Composer priority over env.
- Missing or disabled composer uses default app.
- Composer env enabled without DB flag creates a Customer Access safe-deny app without DB client.
- Composer DB enabled with injected connector/config `readOnly: true` creates a synthetic DB client path.
- Bootstrap creation does not issue DB queries.
- Request through composer-created app with synthetic rows returns HTTP 200 allow envelope.
- Connector throw and DB client throw paths return generic safe-deny without raw error leak.
- `readOnly: false` creates no DB client and returns generic safe-deny.
- Malformed or sensitive composer config does not leak token, secret, DB URL, raw phone, raw address, or raw LINE id.
- Server does not directly import DB adapter, query executor, read-only repository, real DB, repositories, providers, AI, or RAG.
- `startServer({ customerAccessComposer, app })` uses injected app priority and listens only when explicitly called.
- Direct-run behavior remains guarded by `require.main === module`.

## Future Real Env / DB Lifecycle Boundary

Future work that reads real environment variables or creates a real DB client must be a separate bounded task. It must explicitly define:

- Exact allowed env keys.
- Exact connector file.
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

- `node --check src/server.js`
- `node --test tests/customerAccess/customerAccessServerComposerIntegration.unit.test.js`
- `git diff --check -- src/server.js tests/customerAccess/customerAccessServerComposerIntegration.unit.test.js docs/task-642-server-customer-access-composer-integration-injected-env-and-connector-no-shared-db.md`
