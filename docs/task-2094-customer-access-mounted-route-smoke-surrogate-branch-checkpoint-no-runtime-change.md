# Task2094 - Customer Access Mounted Route Smoke-Surrogate Branch Checkpoint

## Scope

- Docs-only checkpoint for accepted Task2093.
- No source/runtime code, test code, package, route, mount, app/server/public route, DB, migration, SQL, smoke, server/listener, network, Zeabur/env, provider, admin, AI/RAG, or billing changes.
- The 7 held historical docs remain untracked and untouched.

## Accepted Task2093 Summary

Task2093 added synthetic mounted-route smoke-surrogate coverage for the accepted Customer Access routes:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

The guard uses synthetic router/request/response objects and dbClient test doubles only. It does not run a real smoke test, start a server/listener, call network endpoint probes, execute or connect to a real DB, run migrations, change SQL/query text, or inspect Zeabur/env/secrets.

## Mounted Route Behavior

### Case Overview Route

Valid `GET /customer-access/:caseId` synthetic requests return the current allow envelope with allowlisted `serviceReport` keys:

- `caseNo`
- `finalAppointmentId`
- `publicReportId`
- `status`
- `summary`

`caseId` is accepted only from path params. Query/body/header/cookie aliases cannot supply or override it.

### Service-Report Route

Valid `GET /customer-access/:caseId/service-report/:reportId` synthetic requests return the accepted public service-report DTO keys:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments`

Public attachment items remain constrained to:

- `attachmentId`
- `label`
- `mimeType`

`caseId` and `reportId` are accepted only from path params. Query/body/header/cookie aliases cannot supply or override identifiers.

## Task2093 Runtime Correction

Task2093 made one narrow source correction in `src/routes/customerAccessRoutes.js`:

- Added a service-report route middleware wrapper.
- The wrapper snapshots route params before existing Customer Access context middleware runs.
- After the existing context middleware completes, the wrapper restores only `reportId` onto `req.params`.
- This preserves the service-report `:reportId` route param for the projection handler.

This does not change the `customerAccessContext` contract. `customerAccessContext.params` remains `caseId`-only for context purposes.

No new route was added. No service-report projection behavior changed beyond preserving intended route-param delivery. No context middleware contract changed.

## Safe-Deny Boundary

Missing or malformed identifiers, service-deny, not-found, and query-failure paths return the existing sanitized unavailable envelope:

- HTTP `404`
- `status: deny`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `data: null`
- `error.messageKey: customerAccess.unavailable`

The unavailable path must not reveal case/report existence.

## Non-Leakage Boundary

Responses and projection query specs must not emit raw request containers, headers, raw headers, body, query, cookies, auth/user/session/channel/access raw objects, tokens, authorization values, SQL sentinels, provider payloads, debug, stack, DB rows/query metadata, internal fields, private fields, or admin-only fields.

Route registration summaries remain unchanged and expose no handlers, raw routers, raw routes, or dependency objects.

## Regression Boundaries

- Do not change service-report projection contracts from Task2058 through Task2070.
- Do not change route registration and mount contracts from Task2072 through Task2079.
- Do not change case overview contracts from Task2080 through Task2086.
- Do not change context middleware contracts from Task2087 through Task2090.
- Do not change HTTP context adapter contracts from Task2091 through Task2092.
- Do not add new routes.
- Do not introduce real smoke, server/listener, network, DB, migration, Zeabur/env, provider, admin, AI/RAG, billing, or package work.

## Verification

- Run `git diff --check -- docs/task-2094-customer-access-mounted-route-smoke-surrogate-branch-checkpoint-no-runtime-change.md`.
- Run `git status --short --branch`.
- Node tests are not required for this docs-only checkpoint unless source or test files change.
