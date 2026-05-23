# Task 633 — Customer Access Server Bootstrap Adapter Helper / Injected DB Client / No Listen / No Shared DB

## Summary

Task 633 adds a server-bootstrap-adjacent helper for future Customer Access DB client injection.

The helper exports:

- `createCustomerAccessEnabledApp(options)`

It composes:

```js
dbClient -> createApp({ customerAccess: { dbClient } })
```

This keeps future bootstrap wiring explicit without modifying `src/server.js`.

## Behavior

`createCustomerAccessEnabledApp(options)` accepts:

- `createApp`: optional injected app factory for tests or future bootstrap composition.
- `dbClient`: optional explicit customer access DB client.
- `customerAccess`: optional existing customer access option bag.

The helper creates an app object only. It does not call `app.listen`, execute SQL, manage DB lifecycle, write audit logs, send notifications, or import provider/AI runtime.

If `customerAccess.repository`, `customerAccess.dbAdapter`, or `customerAccess.queryExecutor` is supplied, the helper preserves those explicit options. A top-level `dbClient` does not overwrite `customerAccess.dbClient`.

## Runtime Boundaries

Task 633 does not:

- Modify `src/app.js`.
- Modify `src/server.js`.
- Start an HTTP server.
- Connect to a shared DB.
- Execute SQL against a real database.
- Add or apply a migration.
- Change schema or indexes.
- Import a real DB singleton, pool, transaction helper, repository, provider, RAG/vector service, or AI runtime.
- Add provider sending, LINE push, SMS, email, app push, or audit writer runtime.
- Change DTO/projection behavior.
- Modify smoke tests or browser tests.

## Future Server Task Boundary

If a future task wires this helper into `src/server.js`, that task must explicitly name:

- The exact server/bootstrap file.
- The allowed env variable boundary.
- The no-secret-logging rule.
- Whether DB access is prohibited, read-only, or limited to an approved disposable DB.
- The exact test command.

General "continue" or "go ahead" is not approval for shared DB access, DDL, migration apply, provider sending, or customer notification.

## Guardrails Preserved

Task 633 preserves:

- One Case = one formal Field Service Report.
- Customer-facing report = filtered publication view.
- LINE user id is not a global identity.
- Organization isolation.
- Data Access Control.
- No internal data leakage.
- No sensitive output.
- No migration or schema change.
