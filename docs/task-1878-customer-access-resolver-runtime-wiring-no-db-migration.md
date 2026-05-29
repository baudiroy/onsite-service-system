# Task1878 - Customer Access Resolver Runtime Wiring / No DB Migration

## Scope

Task1878 verifies and locks the customer access resolver runtime boundary for Phase 8.

This task does not add schema, migrations, seed data, DB execution, Zeabur deploy, public/shared/prod smoke, provider sending, billing provider integration, AI/RAG execution, customer-visible report projection expansion, formal Completion Report / Field Service Report creation, `finalAppointmentId` mutation, or customer-visible publication behavior.

## Files Changed

- `tests/customerAccess/customerAccessResolverRuntimeWiring.static.test.js`
- `docs/task-1878-customer-access-resolver-runtime-wiring-no-db-migration.md`

No runtime source files were changed because the inspected resolver wiring is already present in the current codebase and the safest Task1878 action is to lock the existing boundary.

## Runtime Boundary Confirmed

The current route chain is:

```text
src/routes/index.js
-> src/routes/customerAccessRoutes.js
-> src/customerAccess/customerAccessContextMiddleware.js
-> src/controllers/customerAccessController.js
-> src/customerAccess/customerAccessHttpFacade.js
-> src/customerAccess/customerAccessFacade.js
-> src/customerAccess/customerAccessService.js
-> src/customerAccess/customerAccessResolver.js
-> src/customerAccess/customerAccessResponseEnvelope.js
```

The central router calls `registerCustomerAccessRoutesWithOptions(appRouter, options.customerAccess)`.

The route module registers:

- method: `GET`
- path: `/customer-access/:caseId`
- middleware before controller: `customerAccessContextMiddleware`
- handler: `handleCustomerAccessRequest`

The service layer routes the customer-facing decision through `resolveCustomerAccess()` and then through `buildCustomerAccessEnvelope()`.

## Guardrails Locked By New Static Test

The new static test confirms:

- customer access is registered through the central runtime router,
- the route uses the existing middleware before the controller,
- the controller/service keep resolver and response envelope as the decision boundary,
- the route chain does not directly import the service report projection service,
- the route chain does not directly import migration/provider/AI/billing modules,
- the route chain does not include DB/migration command patterns,
- `src/server.js` uses customer access bootstrap plan/adapter boundaries,
- `src/server.js` does not directly import customer access DB adapter, query executor, or read-only repository internals.

## Explicit Non-goals

Task1878 does not:

- apply or inspect migration targets,
- run SQL,
- connect to a DB,
- create seed/admin/bootstrap data,
- deploy to Zeabur,
- run route smoke against Zeabur/shared/prod,
- expose a new customer-visible report DTO,
- publish a Completion Report / Field Service Report,
- mutate `finalAppointmentId`,
- call provider, billing, or AI/RAG integrations,
- modify admin frontend files,
- change package or lockfiles.

## Next Recommended Task

Task1879 can implement customer-facing report projection service changes only if PM explicitly assigns it.

Task1879 must remain filtered DTO only and must not create, approve, publish, or mutate formal Completion Report / Field Service Report data.

## Verification

Planned verification:

- Customer access targeted tests
- bundled Node syntax/static check when `npm` is unavailable
- `git diff --check` for Task1878 changed files
