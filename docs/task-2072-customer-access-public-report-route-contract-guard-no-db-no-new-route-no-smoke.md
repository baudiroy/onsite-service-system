# Task2072 - Customer Access Public Report Route Contract Guard

## Purpose

Task2072 records and tests the accepted customer-facing service report route contract without adding a route, changing global mounts, or changing runtime source behavior.

This task is tests-plus-docs only. It preserves the existing customerAccess public report route, app adapter, handler, and safe-deny contracts before the next runtime branch.

## Guarded Contract

The accepted public service report route path is:

- `GET /customer-access/:caseId/service-report/:reportId`

The route must use only route params for the projection identifiers:

- `request.params.caseId`
- `request.params.reportId`

The projection service input DTO must remain exactly:

- `dbClient`
- `customerAccessContext`
- `caseId`
- `reportId`

Identifier aliases in query, body, headers, cookies, debug containers, or other request fields must not be used as fallbacks or overrides.

The customer access context middleware remains required before the projection handler. Missing or invalid context must stay on the sanitized unavailable boundary.

## Safe-Deny Route Behavior

Invalid identifiers, missing context, resolver denial, service safe-deny, thrown service errors, or malformed service results must remain customer-invisible:

- HTTP 404
- `status: deny`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `data: null`
- `error.messageKey: customerAccess.unavailable`

No response may leak case/report existence, raw params, raw context, headers, tokens, auth/session data, stacks, SQL, provider/debug/internal fields, or request containers.

## Files Changed

Task2072 changes only targeted route/app adapter/handler/static tests and this documentation checkpoint:

- `tests/customerAccess/customerAccessRoutes.unit.test.js`
- `tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js`
- `tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`
- `tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `docs/task-2072-customer-access-public-report-route-contract-guard-no-db-no-new-route-no-smoke.md`

No source changes were needed.

## Explicit Non-Goals

Task2072 does not authorize:

- new route creation
- global route mounting
- `src/app.js`, `src/server.js`, or `public.routes.js` changes
- DB changes or DB execution
- migrations, SQL, seeds, schema, indexes, psql, migration dry-run, or migration apply
- repository query text or parameter changes
- projection service behavior changes
- Zeabur, environment, smoke, endpoint, or secret inspection
- provider sending
- admin frontend work
- AI/RAG/model calls
- billing, settlement, payment, or invoice work
- package or lockfile changes
- cleanup, reset, stash, revert, or mutation of the 7 held historical untracked docs

## Verification Plan

Expected verification:

- `node --test tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `git diff --check`
- `git status --short --branch`

DB, migration, smoke, endpoint, Zeabur, environment, and secret inspection commands are not authorized.
