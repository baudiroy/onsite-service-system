# Task 650 - Server Customer Access Safe Env Flag Wiring / No DB Client Creation / No Shared DB

## Summary

Task 650 wires limited Customer Access safe environment flags into the default server bootstrap path.

The only supported default env flags are:

- `CUSTOMER_ACCESS_ENABLED`
- `CUSTOMER_ACCESS_READ_ONLY_ENABLED`
- `CUSTOMER_ACCESS_DB_ENABLED`

This task does not read DB URLs, create a DB client, connect to shared DB, execute SQL, add migrations, change schema, modify admin frontend files, modify smoke tests, or add provider / notification / AI / RAG runtime.

## Runtime Change

`src/server.js` now exports:

- `getCustomerAccessSafeEnvFlags(env = process.env)`

The helper copies only the three supported non-sensitive Customer Access flags. It ignores DB URL, token, secret, password, LINE, and AI/provider-style keys.

When no explicit server options are provided, server default bootstrap may use those safe flags to build the existing Customer Access safe-deny app surface.

## DB Boundary

`CUSTOMER_ACCESS_DB_ENABLED=true` is only a feature flag in this task.

Without an explicit pool, DB object, dbClient, connector, or existing injected Customer Access runtime object, the server does not:

- create a DB client
- connect to DB
- query DB
- read DB URL
- read password / token / secret
- execute SQL

The enabled app remains safe-deny unless a future bounded task explicitly wires a read-only DB lifecycle.

## Priority Rules

Existing priority rules are preserved:

1. `options.app` wins over all Customer Access options.
2. `options.customerAccessBootstrap` wins over composer / env / pool options.
3. `options.customerAccessComposer` wins over env / pool options.
4. Explicit `options.env` wins over default process env safe flags.
5. Explicit pool / db options remain opt-in and are not created by this task.
6. Default env safe flags are used only when no higher-priority explicit Customer Access option exists.

## Future Real DB Lifecycle Task

A future real DB lifecycle task must be separately authorized and should define:

- exact env keys
- exact pool provider
- read-only database role
- read-only query execution behavior
- no secret logging
- targeted tests
- lifecycle ownership
- no shared DB or DDL execution unless explicitly authorized
- disposable/local DB approval packet if any DB command is needed

## Guardrails Preserved

- One Case equals one formal Field Service Report for the onsite workflow.
- Customer-facing report remains a filtered publication view, not raw internal report data.
- LINE identifiers are not global identities.
- Organization isolation and Data Access Control remain required.
- Internal notes, audit logs, AI raw payloads, billing internals, settlement internals, raw customer identifiers, and raw channel identifiers must not leak through Customer Access.
- SaaS entitlement, usage, billing, AI Add-on, Enterprise SSO, and provider integrations remain unchanged.

## Verification

Expected targeted checks:

- `node --check src/server.js`
- `node --test tests/customerAccess/customerAccessServerSafeEnvFlagWiring.unit.test.js`
- `git diff --check -- src/server.js tests/customerAccess/customerAccessServerSafeEnvFlagWiring.unit.test.js docs/task-650-server-customer-access-safe-env-flag-wiring-no-db-client-creation-no-shared-db.md`
