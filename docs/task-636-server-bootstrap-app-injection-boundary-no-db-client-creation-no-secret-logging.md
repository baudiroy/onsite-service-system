# Task 636 - Server Bootstrap App Injection Boundary / No DB Client Creation / No Secret Logging

## Summary

Task 636 adds a bounded app injection boundary to `src/server.js`. Future bootstrap work can now pass an already-created app into the server start path without changing Customer Access runtime wiring in this task.

This task does not connect Customer Access to the server, does not create a DB client, does not read secrets, does not run SQL, and does not change migrations, schema, smoke tests, admin frontend files, package metadata, providers, AI, or RAG runtime.

## Files

- `src/server.js`
- `tests/customerAccess/customerAccessServerAppInjection.unit.test.js`
- `docs/task-636-server-bootstrap-app-injection-boundary-no-db-client-creation-no-secret-logging.md`

## Server App Injection Boundary

`src/server.js` now exports:

- `resolveServerApp(options)`
- `createServerBootstrap(options)`
- `startServer(options)`

Behavior:

- `resolveServerApp({ app })` returns the injected app.
- `resolveServerApp()` returns the default app from `src/app.js`.
- `createServerBootstrap(options)` returns `{ app, port, start }`.
- Importing `src/server.js` no longer starts listening by itself.
- Direct execution through `node src/server.js` still starts the server through `require.main === module`.
- `startServer(options)` starts the provided app and returns `{ server, shutdown }`.

## Compatibility

The default direct-run server behavior is preserved:

- The default app remains the app from `src/app.js`.
- The default port remains `env.port`.
- The server still logs its listening message.
- Signal shutdown still closes the PostgreSQL pool for the direct server path.

Unit tests use synthetic app, logger, and pool objects. They do not start a real HTTP server, connect to DB, or load providers.

## Security Boundary

This task does not:

- Create a DB client.
- Import Customer Access DB adapter or query executor modules.
- Import repositories, providers, AI, or RAG modules.
- Read `process.env`.
- Send notifications.
- Execute SQL.
- Run migrations.
- Log tokens, secrets, DB URLs, customer mobile data, raw addresses, or raw LINE identifiers.

## Future Server Integration Boundary

Future Customer Access server wiring must be a separate bounded task. It should explicitly define:

- The exact server file allowed to change.
- Environment variable boundary.
- DB client lifecycle and injection behavior.
- Read-only Customer Access behavior.
- No secret logging.
- No LINE/App/SMS/email/provider sending.
- No AI or RAG runtime.
- Targeted tests.

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
- `node --test tests/customerAccess/customerAccessServerAppInjection.unit.test.js`
- `git diff --check -- src/server.js tests/customerAccess/customerAccessServerAppInjection.unit.test.js docs/task-636-server-bootstrap-app-injection-boundary-no-db-client-creation-no-secret-logging.md`
