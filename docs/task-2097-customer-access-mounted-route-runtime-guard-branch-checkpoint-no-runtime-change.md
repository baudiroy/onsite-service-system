# Task2097 - Customer Access Mounted Route Runtime Guard Branch Checkpoint

## Scope

- Docs-only checkpoint for accepted Task2093 through Task2096.
- No source/runtime code, test code, package, route, mount, app/server/public route, DB, migration, SQL, smoke, server/listener, network, Zeabur/env, provider, admin, AI/RAG, or billing changes.
- The 7 held historical docs remain untracked and untouched.

## Accepted Task Summary

### Task2093 - Synthetic Mounted-Route Smoke-Surrogate Guard

- Covered `GET /customer-access/:caseId`.
- Covered `GET /customer-access/:caseId/service-report/:reportId`.
- Used synthetic router/request/response objects and dbClient test doubles only.
- Did not run real smoke, server/listener, network, DB, migration, or env work.
- Fixed the narrow mounted service-report route-param gap in `src/routes/customerAccessRoutes.js` by preserving `reportId` after existing context middleware.
- Preserved the `customerAccessContext` contract: `customerAccessContext.params` remains `caseId`-only, with no context middleware contract change.

### Task2094 - Mounted-Route Smoke-Surrogate Checkpoint

- Recorded accepted Task2093 mounted-route behavior.
- Recorded safe-deny behavior, DTO keys, non-leakage boundaries, and regression boundaries.

### Task2095 - Route Registration Summary Cross-Check

- Success summaries match synthetic mounted target registrations exactly.
- No extra public Customer Access routes are registered.
- No duplicate method/path pairs are accepted.
- No internal test route is registered through public route registration.
- Failure summaries have no `routes` property and do not leak partial route details.

### Task2096 - Method And Path Strictness

- Accepted public route methods and paths are:
  - `GET /customer-access/:caseId`
  - `GET /customer-access/:caseId/service-report/:reportId`
- Unsupported methods `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, and `HEAD` do not dispatch.
- Near-match, trailing-slash, extra-segment, alias-style, and internal paths do not dispatch.
- Query/body/header/cookie aliases cannot supply missing path params.
- Unmatched method/path cases use the current synthetic unmatched `404` sanitized unavailable convention and do not leak raw data.

## Current Mounted Route Contracts

### Public Routes

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

No other public Customer Access mounted route is accepted by this branch.

### Internal Test Route

The internal test route remains separate from public route registration:

- `/__internal/customer-access/service-reports/:caseId/:reportId`

## Response DTO Contracts

### Case Overview Allow Response

Top-level keys:

- `status`
- `messageKey`
- `customerVisible`
- `data`

Nested data:

- `data.serviceReport`

Allowed `serviceReport` keys:

- `caseNo`
- `finalAppointmentId`
- `publicReportId`
- `status`
- `summary`

### Service-Report Allow Response

Allowed `serviceReport` keys:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments`

Allowed public attachment item keys:

- `attachmentId`
- `label`
- `mimeType`

### Safe-Deny Envelope

Unavailable responses use:

- HTTP `404`
- `status: deny`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `data: null`
- `error.messageKey: customerAccess.unavailable`

## Non-Leakage Boundary

Mounted-route responses, route summaries, and projection query specs must not expose:

- raw request/container/header/rawHeaders/body/rawBody/query/params object/cookies/socket/connection/ip/user/session/auth/channel/access data
- tokens or authorization values
- phone/address/email/LINE raw identity values
- provider payloads or raw payloads
- debug, stack, or SQL
- internal, private, or admin-only fields
- DB rows or query metadata
- existence or non-existence details for cases or reports

## Regression Boundaries

- Do not change service-report projection contracts from Task2058 through Task2070.
- Do not change route registration and mount contracts from Task2072 through Task2079.
- Do not change case overview contracts from Task2080 through Task2086.
- Do not change context middleware contracts from Task2087 through Task2090.
- Do not change HTTP context adapter contracts from Task2091 through Task2092.
- Do not change mounted route smoke-surrogate behavior from Task2093 through Task2096.
- Do not add new routes or HTTP methods.
- Do not introduce real smoke, server/listener, network, DB, migration, Zeabur/env, provider, admin, AI/RAG, billing, or package work.

## Verification

- Run `git diff --check -- docs/task-2097-customer-access-mounted-route-runtime-guard-branch-checkpoint-no-runtime-change.md`.
- Run `git status --short --branch`.
- Node tests are not required for this docs-only checkpoint unless source or test files change.
