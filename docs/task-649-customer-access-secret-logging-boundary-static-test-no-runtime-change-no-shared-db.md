# Task 649 - Customer Access Secret Logging Boundary Static Test / No Runtime Change / No Shared DB

## Summary

Task 649 adds a static boundary test for Customer Access secret logging and sensitive output risks. The test scans Customer Access source, related Customer Access tests, and recent Customer Access task notes to prevent accidental DB URL, token, secret, raw identifier, SQL/params, raw error, or broad object logging patterns from entering the Customer Access path.

This task does not modify runtime source, does not import runtime source, does not read real `process.env`, does not connect to shared DB, does not execute SQL, does not add migrations, and does not run smoke or browser tests.

## Files

- `tests/customerAccess/customerAccessSecretLoggingBoundary.static.test.js`
- `docs/task-649-customer-access-secret-logging-boundary-static-test-no-runtime-change-no-shared-db.md`

## Static Scan Scope

The test scans:

- `src/server.js`
- `src/app.js`
- `src/routes/index.js`
- `src/routes/customerAccessRoutes.js`
- `src/controllers/customerAccessController.js`
- `src/customerAccess/**/*.js`
- `tests/customerAccess/**/*.js` except the static test itself
- `docs/task-64*.md`

## Coverage

The static test verifies:

- Source files do not log `process.env`.
- Source files do not directly log DB URL, DB URL aliases, token, secret, password, LINE access token, LINE channel secret, or connection string.
- Customer Access source does not log SQL text, params, raw phone, raw address, or raw LINE id.
- Source does not log broad serialized runtime objects such as `process.env`, request, response, env, config, dbClient, or pool.
- Customer Access source does not echo raw `error.message` into response bodies.
- Customer Access source does not use interpolated SQL template literals.
- Tests and task docs do not contain real-looking OpenAI keys, Slack tokens, JWTs, LINE user ids, or phone numbers.
- Postgres-like URLs in tests/docs must be synthetic sentinel values.
- Synthetic sentinel strings only appear in tests/docs, not runtime source.
- Customer Access source does not write raw payload files.
- The static boundary test itself avoids real secrets and prohibited command strings.

## Sentinel Policy

Synthetic values such as `should_not_leak`, `must-not-leak`, and `db-url-should-not-leak` are allowed in tests and task docs when used to verify non-leakage behavior. They must not appear in runtime source.

## Future Real Env / DB Lifecycle Boundary

Before any future real env or DB lifecycle task, this boundary should remain in place. Future tasks must still avoid:

- Logging DB URLs, tokens, secrets, passwords, raw phone, raw address, or raw LINE identifiers.
- Dumping SQL params or broad request/config/env/db objects.
- Returning raw errors to customer-facing responses.
- Using full raw payloads in tests, docs, or logs.

## Preserved Product Guardrails

- One Case equals one formal Field Service Report for the onsite service workflow.
- Customer-facing reports remain filtered publication views.
- LINE user identifiers are not global identities.
- Organization isolation and Data Access Control remain required.
- Internal notes, audit logs, AI raw payloads, billing internals, settlement internals, raw channel identifiers, DB URL, token, and secret must not leak through customer access.
- Future SaaS entitlement, usage, AI Add-on, billing, Enterprise SSO, and provider integrations remain unchanged.

## Verification

Expected targeted checks:

- `node --test tests/customerAccess/customerAccessSecretLoggingBoundary.static.test.js`
- `git diff --check -- tests/customerAccess/customerAccessSecretLoggingBoundary.static.test.js docs/task-649-customer-access-secret-logging-boundary-static-test-no-runtime-change-no-shared-db.md`
