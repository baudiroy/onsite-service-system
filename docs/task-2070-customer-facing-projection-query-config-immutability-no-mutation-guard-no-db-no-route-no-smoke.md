# Task2070 - Customer-Facing Projection Query Config Immutability and No-Mutation Guard

## Scope

Task2070 adds runtime guard coverage for the customer-facing service report projection query contract. The task is tests and documentation only; no source behavior change was required because the projection service already builds a fresh frozen query config object with a frozen values array for each valid service call.

## Query Config Contract

Valid customer-facing projection calls continue to invoke:

```js
dbClient.query(queryConfig)
```

The query config shape remains:

```js
{
  name: 'customerServiceReportProjection',
  readOnly: true,
  text: '<existing static SELECT query text>',
  values: Object.freeze([organizationId, customerId, caseId, reportId]),
}
```

The query config object itself is frozen with `Object.freeze`. The `values` array is also frozen. Values remain validated primitive strings in this order:

1. `customerAccessContext.organizationId`
2. `customerAccessContext.customerId`
3. validated top-level `caseId`, consistent with `customerAccessContext.caseId`
4. validated top-level `reportId`

Task2070 does not change SQL text, query semantics, or query parameter order.

## Guard Coverage Added

- Caller-owned service input, `customerAccessContext`, and DB row fixtures remain unchanged after service calls.
- Unknown top-level raw/debug/request-like service input fields are not used for query binding and do not leak into the response.
- Unknown raw/debug/header fields inside `customerAccessContext` fail closed before query and remain unchanged on the caller object.
- A synthetic `dbClient.query` attempts to mutate `queryConfig.name`, `queryConfig.readOnly`, `queryConfig.text`, `queryConfig.values`, individual values, and additional debug/header fields. The frozen config prevents the mutation, and the safe projection remains valid.
- Sequential valid calls with different identifiers receive distinct frozen query config objects and distinct frozen values arrays.
- Mutation sentinel strings, query config details, SQL text, raw context, raw service input, and debug/token/header additions from the synthetic DB client do not appear in response JSON.

## Preserved Boundaries

- No actual DB execution.
- No DB changes, migrations, SQL changes, seeds, schema, indexes, psql, migration dry-run, or migration apply.
- No query text or parameter order change.
- No route, controller, HTTP handler, app adapter, or global mount change.
- No Zeabur, env, runtime smoke, endpoint probe, or secret inspection.
- No provider sending, admin frontend, AI/RAG/provider/model, billing, settlement, payment, invoice, or package change.
- The 7 held historical docs remain untracked and untouched.

## Verification

- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js` - PASS, 59/59 tests.
- `git diff --check` - PASS.
- `git status --short --branch` - PASS, tracked changes limited to Task2070 files plus the same 7 held historical docs remaining untracked.
