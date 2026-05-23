# Task 637 - Customer Access Server Wiring via Bootstrap Plan / No DB Client Creation / No Secret Logging

## Summary

Task 637 wires `src/server.js` to the Customer Access bootstrap plan and app adapter path. The server can now accept explicit `customerAccessBootstrap` options and build a Customer Access enabled app through the existing sanitized plan path.

This task does not create a DB client, does not read environment secrets, does not connect to a real DB, does not execute SQL, and does not change migrations, schema, smoke tests, admin frontend files, package metadata, providers, AI, or RAG runtime.

## Files

- `src/server.js`
- `tests/customerAccess/customerAccessServerBootstrapPlanWiring.unit.test.js`
- `docs/task-637-customer-access-server-wiring-via-bootstrap-plan-no-db-client-creation-no-secret-logging.md`

## Server Wiring Contract

`resolveServerApp(options)` now follows this priority:

1. If `options.app` exists, use the injected app.
2. If `options.customerAccessBootstrap` exists, build a sanitized server bootstrap plan.
3. If the plan enables Customer Access app creation, call `createCustomerAccessEnabledApp(plan.appFactoryOptions)`.
4. If the plan is disabled, malformed, or fail-closed, use the default app.
5. If no options are present, use the default app.

`createServerBootstrap(options)` and `startServer(options)` use the same app resolution boundary.

## Security Boundary

The server now imports only:

- `./customerAccess/customerAccessServerBootstrapPlan`
- `./customerAccess/customerAccessAppBootstrapAdapter`

The server does not directly import:

- Customer Access DB adapter.
- Customer Access DB query executor.
- Customer Access read-only repository.
- Real DB singleton, pool, or connection for bootstrap creation.
- Transaction helper.
- Repositories.
- Providers, LINE, SMS, email, App push.
- AI or RAG modules.

The direct-run shutdown path still lazily loads the existing PostgreSQL pool only when shutdown needs to close it, preserving existing direct server behavior without touching DB during module import or bootstrap creation.

## Tests

The targeted unit test covers:

- `options.app` priority over `customerAccessBootstrap`.
- Missing `customerAccessBootstrap` uses default app.
- Disabled `customerAccessBootstrap` uses default app.
- Enabled `customerAccessBootstrap` with synthetic `dbClient` creates a Customer Access enabled app path.
- Bootstrap creation does not call the synthetic `dbClient`.
- Customer Access route allow envelope can be served by app invocation without network listen.
- Throwing synthetic `dbClient` returns generic safe deny without raw error leak.
- Malformed sensitive config does not leak token, secret, or DB URL.
- Direct-run behavior remains guarded by `require.main === module`.
- Server does not directly import DB adapters, query executors, repositories, providers, AI, or RAG.
- `startServer` listens only when explicitly called.

## Future Server Integration Boundary

Future work that creates a real DB client from environment configuration must be a separate bounded task. It must explicitly define:

- Exact environment keys.
- DB client lifecycle.
- Read-only execution behavior.
- No secret logging.
- No shared DB or DDL execution unless explicitly authorized.
- Targeted tests.
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
- `node --test tests/customerAccess/customerAccessServerBootstrapPlanWiring.unit.test.js`
- `git diff --check -- src/server.js tests/customerAccess/customerAccessServerBootstrapPlanWiring.unit.test.js docs/task-637-customer-access-server-wiring-via-bootstrap-plan-no-db-client-creation-no-secret-logging.md`
