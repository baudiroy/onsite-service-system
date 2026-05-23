# Task 635 - Customer Access Server Bootstrap Plan Helper / No Server Change / No DB Creation

## Summary

Task 635 adds a small server bootstrap plan helper for Customer Access. The helper converts sanitized Customer Access bootstrap options into an explicit plan that a future server integration task can consume.

This task does not modify `server.js`, `app.js`, routes, repositories, services, database modules, migrations, smoke tests, admin frontend files, or package metadata.

## Files

- `src/customerAccess/customerAccessServerBootstrapPlan.js`
- `tests/customerAccess/customerAccessServerBootstrapPlan.unit.test.js`
- `docs/task-635-customer-access-server-bootstrap-plan-helper-no-server-change-no-db-creation.md`

## Plan Helper Contract

`buildCustomerAccessServerBootstrapPlan(input)` is a pure CommonJS helper.

It:

- Uses `buildCustomerAccessBootstrapOptions(input)`.
- Fails closed by default.
- Returns disabled plan output when input is missing, malformed, or explicitly disabled.
- Returns enabled plan output only when sanitized Customer Access runtime options are present.
- Produces `appFactoryOptions` for future app creation.
- Produces `safeSummary` using boolean-only runtime option presence flags.

Disabled plan:

```js
{
  enabled: false,
  shouldCreateCustomerAccessEnabledApp: false,
  appFactoryOptions: {},
  warnings: [],
  safeSummary: {
    customerAccessEnabled: false,
    hasRepository: false,
    hasDbAdapter: false,
    hasQueryExecutor: false,
    hasDbClient: false
  }
}
```

Enabled plan:

```js
{
  enabled: true,
  shouldCreateCustomerAccessEnabledApp: true,
  appFactoryOptions: {
    customerAccess: {
      repository,
      dbAdapter,
      queryExecutor,
      dbClient
    }
  },
  warnings: [],
  safeSummary: {
    customerAccessEnabled: true,
    hasRepository: true,
    hasDbAdapter: true,
    hasQueryExecutor: true,
    hasDbClient: true
  }
}
```

## Security Boundary

The helper does not:

- Read `process.env`.
- Import `app` or `server`.
- Import DB clients, pools, transactions, repositories, providers, AI, or RAG modules.
- Create a DB client.
- Execute SQL.
- Listen on a port.
- Send notifications.
- Write audit logs.
- Log anything.
- Mutate input.

`safeSummary` must stay safe metadata only. It must not contain DB URLs, tokens, secrets, customer mobile data, raw LINE identifiers, addresses, full payloads, or object dumps.

Disabled config must not pass `repository`, `dbAdapter`, `queryExecutor`, or `dbClient` into `appFactoryOptions`.

## Future Server Integration Boundary

Future `server.js` integration must be a separate bounded task. It should explicitly define:

- The exact server file allowed to change.
- Environment variable boundary.
- DB client lifecycle and injection behavior.
- No secret logging.
- Read-only Customer Access behavior.
- No LINE/App/SMS/email/provider sending.
- No survey or AI runtime.
- Minimal tests and no smoke expansion unless explicitly approved.

This task intentionally leaves that integration unimplemented.

## Preserved Product Guardrails

- One Case equals one formal Field Service Report for the onsite service workflow.
- Customer-facing reports remain filtered publication views, not raw internal Field Service Reports.
- LINE user identifiers are not global identity.
- Organization isolation and Data Access Control remain required.
- Internal notes, audit logs, AI raw payloads, billing internals, settlement internals, and raw channel identifiers must not leak through customer access.
- Future SaaS entitlement, usage, AI Add-on, billing, Enterprise SSO, and provider integrations remain unchanged.

## Verification

Expected targeted checks:

- `node --check src/customerAccess/customerAccessServerBootstrapPlan.js`
- `node --test tests/customerAccess/customerAccessServerBootstrapPlan.unit.test.js`
- `git diff --check -- src/customerAccess/customerAccessServerBootstrapPlan.js tests/customerAccess/customerAccessServerBootstrapPlan.unit.test.js docs/task-635-customer-access-server-bootstrap-plan-helper-no-server-change-no-db-creation.md`
