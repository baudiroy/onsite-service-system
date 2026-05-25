# Task 647 - Server Explicit Pool Full Route Integration Test / Synthetic Pool / No Shared DB

## Summary

Task 647 adds a full route integration test for the explicit server pool options path:

```text
server options.customerAccessPool/customerAccessDbClientConfig
-> composer path
-> app/router
-> mounted customer access route
-> middleware
-> DB query executor
-> read-only repository
-> response
```

This task does not modify runtime source, does not read real `process.env`, does not connect to shared DB, does not execute real SQL, does not add migrations, and does not change schema, API behavior, smoke tests, browser tests, providers, AI, or RAG runtime.

## Files

- `tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js`
- `docs/task-647-server-explicit-pool-full-route-integration-test-synthetic-pool-no-shared-db.md`

## Coverage

The integration test covers:

- Server explicit pool all-allow synthetic rows return HTTP 200 allow envelope.
- Allow response includes only customer-visible service report data.
- Allow response strips internal note, audit log, AI raw payload, internal billing data, settlement data, final appointment id, raw phone, raw address, raw LINE id, token, secret, DB URL, and SQL fragments.
- Bootstrap creation does not call `pool.query` before request execution.
- `readOnly: false` returns generic safe-deny 404 and does not query pool.
- Pool query throw returns generic safe-deny 404 without raw error leak.
- Malformed pool result returns generic safe-deny 404.
- Env disabled + pool returns default safe-deny behavior and does not query pool.
- `options.app` priority bypasses pool path.
- Server import/bootstrap creation does not trigger listen.
- Server source does not directly import Customer Access DB adapter, query executor, read-only repository, read-only connector, real DB, transaction, repository, provider, AI, or RAG modules.
- Test file uses only synthetic sentinel strings and no real secrets.

## Security Boundary

The test uses synthetic pool, synthetic env-like input, synthetic rows, and synthetic sentinel strings only.

It does not:

- Read real `process.env`.
- Use real customer PII.
- Use real DB URL, token, secret, LINE credential, or AI provider setting.
- Connect to shared DB.
- Execute real SQL.
- Start a real HTTP server.
- Run browser or smoke tests.
- Send provider messages.

## Future Real DB / Env Lifecycle Boundary

Future work that connects explicit server pool options to a real DB provider must be a separate bounded task. It must explicitly define:

- Exact env keys.
- Exact DB client/provider.
- DB lifecycle and shutdown behavior.
- Read-only role and query behavior.
- Disposable DB or explicit no-shared-DB boundary.
- No secret logging.
- Targeted tests.
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

- `node --test tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js`
- `git diff --check -- tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js docs/task-647-server-explicit-pool-full-route-integration-test-synthetic-pool-no-shared-db.md`
