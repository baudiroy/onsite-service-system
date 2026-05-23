# Task 643 - Customer Access Full Bootstrap Composition Integration Test / Synthetic Connector / No Shared DB

## Summary

Task 643 adds a full bootstrap composition integration test for Customer Access. The test verifies the explicit caller-provided path:

```text
env-like object + injected connector/config
-> composeCustomerAccessBootstrap
-> server customerAccessComposer path
-> app/router
-> route middleware
-> DB query executor
-> read-only repository
-> mounted route response
```

This task does not modify runtime source, does not read real `process.env`, does not connect to shared DB, does not execute real SQL, and does not change migrations, schema, smoke tests, admin frontend files, package metadata, providers, AI, or RAG runtime.

## Files

- `tests/customerAccess/customerAccessFullBootstrapComposition.integration.test.js`
- `docs/task-643-customer-access-full-bootstrap-composition-integration-test-synthetic-connector-no-shared-db.md`

## Coverage

The test covers:

- Full all-allow synthetic connector path returns HTTP 200 allow envelope.
- The allow response includes only customer-visible service report data.
- Internal service report fields are stripped.
- Response excludes DB URL, token, secret, connection string, raw phone, raw address, and raw LINE id.
- App bootstrap does not issue DB queries before request execution.
- `readOnly: false` results in generic safe-deny 404.
- Connector throw results in generic safe-deny 404 without raw error leak.
- DB client query throw results in generic safe-deny 404 without raw error leak.
- Env disabled results in generic safe-deny behavior.
- `options.app` injected priority bypasses composer.
- Direct-run listen is not triggered during test import.
- Server bootstrap source does not directly import DB adapter, DB query executor, read-only repository, real DB, transaction, repository, provider, AI, or RAG modules.
- Final appointment id and internal fields are not exposed.

## Security Boundary

The test uses synthetic connector, synthetic DB client, synthetic rows, and synthetic sentinel strings only.

It does not:

- Read real `process.env`.
- Connect to shared DB.
- Execute real SQL.
- Run migrations.
- Start a real HTTP server.
- Run browser or smoke tests.
- Send provider messages.
- Use real customer PII, tokens, secrets, LINE credentials, or AI provider settings.

## Future Real DB / Env Lifecycle Boundary

Future work that reads real environment variables or creates a real DB client must be a separate bounded task. It must explicitly define:

- Exact allowed env keys.
- DB client creation and lifecycle.
- Disposable DB or explicit no-shared-DB boundary.
- Read-only execution behavior.
- No secret logging.
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

- `node --test tests/customerAccess/customerAccessFullBootstrapComposition.integration.test.js`
- `git diff --check -- tests/customerAccess/customerAccessFullBootstrapComposition.integration.test.js docs/task-643-customer-access-full-bootstrap-composition-integration-test-synthetic-connector-no-shared-db.md`
