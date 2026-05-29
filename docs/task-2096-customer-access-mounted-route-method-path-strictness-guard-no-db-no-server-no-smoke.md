# Task2096 - Customer Access Mounted Route Method and Path Strictness Guard

## Scope

- Tests-only plus documentation guard for Customer Access public mounted-route method and path strictness.
- No source/runtime code changes were expected or needed.
- No real smoke test, server/listener startup, network endpoint probe, DB execution, DB connection, migration, SQL/query text change, Zeabur/env inspection, provider/admin/AI/RAG/billing/package work, new route, new HTTP method, global mount, or internal test route public registration.
- The 7 held historical docs remain untracked and untouched.

## Accepted Public Routes

Only these public Customer Access route contracts may dispatch:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

Valid synthetic GET dispatch still reaches the accepted case overview and service-report handlers, preserving Task2093 mounted-route behavior and Task2095 route summary cross-check behavior.

## Unsupported Methods

The guard verifies that these methods do not dispatch against either accepted path:

- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `OPTIONS`
- `HEAD`

Unsupported methods follow the current synthetic unmatched-route convention and return sanitized unavailable output without invoking Customer Access handlers.

## Path Strictness

Near-match, missing-segment, trailing-slash, extra-segment, alias-style, and internal test paths do not dispatch.

Covered examples include:

- `/customer-access`
- `/customer-access/:caseId/`
- `/customer-access/:caseId/extra`
- `/customer-access/:caseId/service-report`
- `/customer-access/:caseId/service-report/`
- `/customer-access/:caseId/service-report/:reportId/`
- `/customer-access/:caseId/service-report/:reportId/extra`
- `/customer-access/:caseId/service_reports/:reportId`
- `/customer-access/:caseId/reports/:reportId`
- `/customer-access/:caseId/service-report/:reportId/download`
- `/__internal/customer-access/service-reports/:caseId/:reportId`

Query/body/header/cookie aliases cannot supply missing path params for these near-match paths.

## Non-Leakage

Unmatched method/path responses must not leak raw path params, raw query/body/header/cookie values, raw request containers, auth/user/session data, token or authorization values, provider/debug/internal fields, SQL, or stack sentinels.

Handler/facade/projection call counts remain zero for unmatched method/path cases.

## Regression Boundaries

- Do not change service-report projection contracts from Task2058 through Task2070.
- Do not change route registration and mount contracts from Task2072 through Task2079.
- Do not change case overview contracts from Task2080 through Task2086.
- Do not change context middleware contracts from Task2087 through Task2090.
- Do not change HTTP context adapter contracts from Task2091 through Task2092.
- Do not change mounted-route behavior from Task2093.
- Do not change route summary cross-check behavior from Task2095.
- Do not add new routes or HTTP methods.

## Verification

- Run targeted Customer Access mounted route, route registration, internal mount, and static tests.
- Run `git diff --check`.
- Run `git status --short --branch`.
