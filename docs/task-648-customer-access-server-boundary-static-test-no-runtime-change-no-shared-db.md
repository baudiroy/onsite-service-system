# Task 648 - Customer Access Server Boundary Static Test / No Runtime Change / No Shared DB

## Summary

Task 648 adds a source-level static boundary test for the Customer Access server/bootstrap/source chain. The test is designed to prevent future regressions where server or Customer Access modules directly import real DB singletons, transaction helpers, existing domain repositories, provider modules, AI/RAG modules, unsafe `process.env` Customer Access enablement, secret logging, or unintended server listen paths.

This task does not modify runtime source, does not import `src/server.js` or `src/app.js`, does not read real `process.env`, does not connect to shared DB, does not execute SQL, does not add migrations, and does not run smoke or browser tests.

## Files

- `tests/customerAccess/customerAccessServerBoundary.static.test.js`
- `docs/task-648-customer-access-server-boundary-static-test-no-runtime-change-no-shared-db.md`

## Static Scan Scope

The test scans:

- `src/server.js`
- `src/app.js`
- `src/routes/index.js`
- `src/routes/customerAccessRoutes.js`
- `src/customerAccess/customerAccessEnvBoundary.js`
- `src/customerAccess/customerAccessBootstrapComposer.js`
- `src/customerAccess/customerAccessDbClientFactory.js`
- `src/customerAccess/customerAccessReadOnlyDbConnector.js`
- `src/customerAccess/customerAccessDbAdapter.js`
- `src/customerAccess/customerAccessDbQueryExecutor.js`
- `src/customerAccess/customerAccessReadOnlyRepository.js`
- `src/customerAccess/customerAccessDbReadModelMapper.js`
- `src/customerAccess/customerAccessContextMiddleware.js`
- `src/customerAccess/customerAccessContextProvider.js`
- `src/controllers/customerAccessController.js`

## Coverage

The static test verifies:

- All boundary source files exist.
- `src/server.js` does not directly import Customer Access DB adapter, DB query executor, read-only repository, or read-only connector.
- `src/server.js` does not directly read `process.env` for Customer Access enablement, DB URL, token, secret, password, or LINE channel configuration.
- `src/server.js` and `src/app.js` do not directly import real DB singleton, transaction, repository, provider, LINE/SMS/Email/App push, AI, RAG, vector, or OpenAI modules.
- `src/routes/index.js` customer-access imports remain limited to the Customer Access route and route registry.
- Customer Access chain modules do not import provider, AI, RAG, vector, OpenAI, SMS, LINE, Email, or push provider modules.
- Customer Access chain modules do not import existing domain repositories.
- Boundary source files do not log `process.env` or sensitive env-like values.
- `app.listen` remains owned by `src/server.js` and guarded by the direct-run path.
- Customer Access boundary source files do not write files or streams.
- DB-like runtime import keywords stay inside bounded Customer Access DB files.
- Bounded Customer Access DB files still do not import singleton DB or transaction helpers.
- The static test itself uses synthetic scans only and no real secrets.

## Allowed Dependency Direction

The intended dependency direction remains:

```text
server -> app / bootstrap helpers
app -> route index
route index -> customer access route registration
customer access route -> middleware + controller
middleware -> customer access context provider
provider -> repository contract / injected repository path
repository/query path -> query spec / row mapper / injected executor only
```

The test intentionally avoids failing on unrelated established application routes in `src/routes/index.js`; it only locks the Customer Access boundary and direct server/app import risks.

## Bounded DB Files

The following Customer Access files are allowed to contain bounded DB/query vocabulary, but still must not import singleton DB or transaction helpers:

- `src/customerAccess/customerAccessDbQueryExecutor.js`
- `src/customerAccess/customerAccessDbClientFactory.js`
- `src/customerAccess/customerAccessReadOnlyDbConnector.js`
- `src/customerAccess/customerAccessDbAdapter.js`
- `src/customerAccess/customerAccessDbReadModelMapper.js`

## Preserved Product Guardrails

- One Case equals one formal Field Service Report for the onsite service workflow.
- Customer-facing reports remain filtered publication views.
- LINE user identifiers are not global identities.
- Organization isolation and Data Access Control remain required.
- Internal notes, audit logs, AI raw payloads, billing internals, settlement internals, raw channel identifiers, DB URL, token, and secret must not leak through customer access.
- Future SaaS entitlement, usage, AI Add-on, billing, Enterprise SSO, and provider integrations remain unchanged.

## Verification

Expected targeted checks:

- `node --test tests/customerAccess/customerAccessServerBoundary.static.test.js`
- `git diff --check -- tests/customerAccess/customerAccessServerBoundary.static.test.js docs/task-648-customer-access-server-boundary-static-test-no-runtime-change-no-shared-db.md`
