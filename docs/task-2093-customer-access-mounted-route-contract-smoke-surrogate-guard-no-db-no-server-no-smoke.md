# Task2093 - Customer Access Mounted Route Contract Smoke-Surrogate Guard

## Scope

- Synthetic mounted-route smoke-surrogate guard for Customer Access routes.
- No real smoke test, no server/listener startup, no network endpoint probe, no DB execution, no DB connection, no migration, no SQL/query text change, no Zeabur/env inspection, no provider/admin/AI/RAG/billing/package work, and no new route/global mount changes.
- The 7 held historical docs remain untracked and untouched.

## Covered Mounted Routes

The synthetic mounted-route tests cover the accepted Customer Access route contracts:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

The guard uses existing injected router/mount-target patterns and invokes registered handlers directly through synthetic request/response objects. It does not start an HTTP server or listener and does not call real endpoints.

Task2093 also preserves the service-report route `reportId` route param across the existing customer-access context middleware boundary so the accepted mounted service-report route can reach the projection handler without relying on query/body/header/cookie aliases.

## Guarded Behavior

### Synthetic Mount Success

- The synthetic router registers exactly the two accepted GET routes.
- The case overview route can dispatch a valid synthetic request and return the current allow envelope.
- The service-report route can dispatch a valid synthetic request and return the current service-report allow envelope.
- Registration and dispatch do not call `listen`.

### Params-Only Identifiers

- `caseId` for the case overview route is accepted only from route params.
- `caseId` and `reportId` for the service-report route are accepted only from route params.
- Query/body/header/cookie aliases cannot supply or override identifiers.
- Raw request containers do not alter the mounted response or projection lookup values.

### Safe-Deny

Invalid, missing, malformed, alias-only, or service-denied route input returns the existing sanitized unavailable envelope:

- HTTP `404`
- `status: deny`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `data: null`
- `error.messageKey: customerAccess.unavailable`

The safe-deny path must not reveal case/report existence.

### Non-Leakage

Responses and projection query specs must not expose raw request containers, headers, raw headers, query, body, cookies, raw params objects, auth/user/session/channel/access raw objects, tokens, authorization values, phone/address/email/LINE raw identity, provider payloads, debug, stack, SQL sentinels, DB rows/query metadata, or internal/private/admin-only fields.

### Response Shape Regression

Case overview allow responses remain constrained to:

- top-level: `status`, `messageKey`, `customerVisible`, `data`
- `data.serviceReport`
- `serviceReport.caseNo`
- `serviceReport.finalAppointmentId`
- `serviceReport.publicReportId`
- `serviceReport.status`
- `serviceReport.summary`

Service-report allow responses remain constrained to the accepted Task2059/Task2060/Task2061 public DTO keys:

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

## Regression Boundaries

- Do not change service-report projection contracts from Task2058 through Task2070.
- Do not change route registration and mount contracts from Task2072 through Task2079.
- Do not change case overview contracts from Task2080 through Task2086.
- Do not change context middleware contracts from Task2087 through Task2090.
- Do not change HTTP context adapter contracts from Task2091 through Task2092.
- Do not change route paths or add new routes.
- Do not introduce DB, migration, smoke, server/listener, network, global mount, src app/server/public routes, Zeabur/env, provider, admin, AI/RAG, billing, or package work.

## Verification

- Run targeted Customer Access mounted route, route registration, internal mount, service-report handler, and static tests.
- Run `git diff --check`.
- Run `git status --short --branch`.
