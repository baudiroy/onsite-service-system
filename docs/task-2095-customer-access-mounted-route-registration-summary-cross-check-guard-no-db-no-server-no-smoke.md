# Task2095 - Customer Access Mounted Route Registration Summary Cross-Check Guard

## Scope

- Tests-only plus documentation guard for Customer Access route registration summary consistency.
- No source/runtime code changes were expected or needed.
- No real smoke test, server/listener startup, network endpoint probe, DB execution, DB connection, migration, SQL/query text change, Zeabur/env inspection, provider/admin/AI/RAG/billing/package work, new route, global mount, or internal test route public registration.
- The 7 held historical docs remain untracked and untouched.

## Guarded Summary Contract

Successful `registerCustomerAccessRoutes` calls must return the sanitized accepted summary:

- `registered: true`
- `routes[0].method: GET`
- `routes[0].path: /customer-access/:caseId`
- `routes[1].method: GET`
- `routes[1].path: /customer-access/:caseId/service-report/:reportId`

The synthetic mounted target registration records must exactly match `summary.routes`.

Every route in `summary.routes` must exist in the injected synthetic target. Every registered public Customer Access route must appear in `summary.routes`.

## No Extra Or Duplicate Routes

The public Customer Access registration guard allows only:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

The guard asserts there are no duplicate method/path pairs and no public registration of internal test route paths such as `/__internal/customer-access`.

## Summary Non-Leakage

The sanitized route registration summary must not expose:

- handler functions
- raw router or app target objects
- raw dbClient objects
- projectionService or facade function source
- raw route objects
- env/provider/debug/internal fields
- SQL, token, or header-looking sentinels

## Failure Summary Contract

Invalid mount target, invalid dbClient, first-route registration failure, and second-route registration failure return sanitized failure summaries:

- `registered: false`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `reasonCode`

Failure summaries must not include `routes`, partial route details, raw targets, handlers, raw thrown errors, SQL/token/debug/internal/provider sentinels, or dependency objects.

## Regression Boundaries

- Do not change service-report projection contracts from Task2058 through Task2070.
- Do not change route registration and mount contracts from Task2072 through Task2079.
- Do not change case overview contracts from Task2080 through Task2086.
- Do not change context middleware contracts from Task2087 through Task2090.
- Do not change HTTP context adapter contracts from Task2091 through Task2092.
- Do not change mounted-route behavior from Task2093.
- Do not add new routes.
- Do not introduce real smoke, server/listener, network, DB, migration, Zeabur/env, provider, admin, AI/RAG, billing, or package work.

## Verification

- Run targeted Customer Access routes, mounted route, and static tests.
- Run `git diff --check`.
- Run `git status --short --branch`.
