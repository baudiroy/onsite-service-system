# Task 634 — Customer Access Bootstrap Config Sanitizer and App Adapter Wiring / No DB Client Creation / No Secret Logging

## Summary

Task 634 adds a bounded customer access bootstrap config sanitizer and wires it into the customer access app bootstrap adapter.

This task is runtime + unit tests + documentation, but it remains bootstrap-only. It does not create a DB client, read environment variables, modify `server.js`, connect to a database, execute SQL, add migrations, change schema, register new routes, or run smoke tests.

## Files Changed

- `src/customerAccess/customerAccessBootstrapConfig.js`
- `src/customerAccess/customerAccessAppBootstrapAdapter.js`
- `tests/customerAccess/customerAccessBootstrapConfig.unit.test.js`
- `tests/customerAccess/customerAccessAppBootstrapAdapterConfig.unit.test.js`
- `docs/task-634-customer-access-bootstrap-config-sanitizer-and-app-adapter-wiring-no-db-client-creation-no-secret-logging.md`

## Bootstrap Config Sanitizer

`src/customerAccess/customerAccessBootstrapConfig.js` exports:

- `buildCustomerAccessBootstrapOptions(options)`
- `buildDisabledCustomerAccessBootstrapOptions()`
- `stripSensitiveKeys(value)`

The sanitizer is a pure CommonJS helper. It only normalizes caller-provided options and is disabled / fail-closed by default.

Allowed customer access runtime options are intentionally narrow:

- `repository`
- `dbAdapter`
- `queryExecutor`
- `dbClient`
- `getInput`

The sanitizer preserves explicit `customerAccess.repository`, `customerAccess.dbAdapter`, `customerAccess.queryExecutor`, and `customerAccess.dbClient`. A top-level `dbClient` is only copied when `customerAccess.dbClient` is absent.

## Priority / Enabled Behavior

- Missing or malformed input returns `{ enabled: false }`.
- `enabled: false` returns `{ enabled: false }` and does not pass runtime options through.
- `customerAccess.enabled: false` also returns `{ enabled: false }`.
- `enabled: true` with a top-level `dbClient` returns `{ enabled: true, customerAccess: { dbClient } }`.
- `customerAccess.dbClient` is not overwritten by a top-level `dbClient`.
- Malformed `customerAccess` values are not passed through.

## Secret and Sensitive Data Boundary

The sanitizer does not log and does not output obvious sensitive bootstrap keys such as:

- token / secret / password
- database URL / connection string
- raw LINE id
- raw phone
- raw address

It also does not read `process.env`, create DB clients, import app/server modules, import DB pools, import repositories, import providers, import AI/RAG modules, write audit logs, or execute SQL.

## App Bootstrap Adapter Wiring

`src/customerAccess/customerAccessAppBootstrapAdapter.js` now calls `buildCustomerAccessBootstrapOptions(options)` before invoking the injected or default `createApp`.

The adapter behavior is:

- Disabled sanitized config calls `createApp({})`.
- Enabled sanitized config calls `createApp({ customerAccess })`.
- The adapter does not call `app.listen`.
- The adapter does not read `process.env`.
- The adapter does not create a DB client.
- The adapter does not call the provided `dbClient` during app creation.

## Unit Test Coverage

`tests/customerAccess/customerAccessBootstrapConfig.unit.test.js` covers:

- Exported sanitizer functions.
- Missing input disabled config.
- Explicit disabled config stripping runtime options.
- Top-level `dbClient` mapping.
- Explicit repository / dbAdapter / queryExecutor preservation.
- Explicit `customerAccess.dbClient` priority.
- Malformed object and sensitive key stripping.
- Input object immutability.
- No logging side effects.
- No app/server/DB/provider/AI imports.

`tests/customerAccess/customerAccessAppBootstrapAdapterConfig.unit.test.js` covers:

- Adapter uses sanitized customer access options.
- Disabled config creates no-options app behavior.
- Enabled config passes sanitized `dbClient`.
- Malformed sensitive config does not reach `createApp`.
- Explicit repository / dbAdapter / queryExecutor preservation.
- Top-level `dbClient` does not override explicit `customerAccess.dbClient`.
- Adapter creation does not call `dbClient`.
- Adapter does not call `listen`.
- Adapter does not import server or restricted runtime modules.
- No token / secret / DB URL leak in returned object.

## Future Server Integration Boundary

A future task may wire bootstrap options into `src/server.js`, but that must be separately approved and must explicitly define:

- Exact env variable boundary.
- No secret logging.
- DB client lifecycle ownership.
- Read-only behavior.
- Safe failure behavior.
- Exact test commands.

General "continue" or "go ahead" remains insufficient approval for shared DB access, migration apply, provider sending, customer notification, or any secret-bearing runtime behavior.

## Guardrails Preserved

This task preserves:

- One Case = one formal Field Service Report.
- Customer-facing report = filtered publication view.
- LINE user id is not a global identity.
- Organization isolation.
- Data Access Control.
- No internal data leakage.
- No sensitive output.
- No DB / migration / schema change.
- No API route change.
- No provider sending.
- No AI / RAG runtime.
