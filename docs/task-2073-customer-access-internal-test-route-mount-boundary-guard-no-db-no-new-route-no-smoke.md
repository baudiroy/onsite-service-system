# Task2073 - Customer Access Internal Test Route Mount Boundary Guard

## Purpose

Task2073 strengthens the existing Customer Access internal test route mount boundary so it cannot be mistaken for production or global route registration.

This task keeps the mount injected-only, preserves the Task2072 route-param and service-input boundary, and does not add any production route or global mount.

## Guarded Internal Mount Boundary

The internal test mount is allowed only for explicitly injected app/router targets.

The accepted internal test mount path is:

- `GET /__internal/customer-access/service-reports/:caseId/:reportId`

The path must remain internal and must include both route params:

- `:caseId`
- `:reportId`

The internal mount must route through the existing projection app adapter and handler flow. It must not create an app, start a listener, create a DB connection, read environment configuration, call provider integrations, or mount through `src/app.js`, `src/server.js`, `public.routes.js`, or a global route registry.

## Guarded Request Boundary

The internal mount preserves the Task2072 identifier contract:

- identifiers come from `request.params.caseId` and `request.params.reportId`
- query/body/header/cookie aliases cannot supply or override identifiers
- missing or invalid `customerAccessContext` returns sanitized unavailable safe-deny

The projection service input DTO remains exactly:

- `dbClient`
- `customerAccessContext`
- `caseId`
- `reportId`

Raw request containers must not be passed to projection service:

- `req` / `request`
- `headers`
- `authorization`
- `cookies`
- `query`
- `body`
- `params` object
- `user` / `session`
- `socket` / `connection`

## Files Changed

- `src/customerAccess/customerAccessInternalTestRouteMount.js`
- `tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js`
- `tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `docs/task-2073-customer-access-internal-test-route-mount-boundary-guard-no-db-no-new-route-no-smoke.md`

The source change is limited to the internal test route mount boundary:

- default internal test mount path now includes `:caseId` and `:reportId`
- custom internal test mount paths must include both params
- test-only `projectionService` injection is forwarded to the existing projection app adapter for boundary verification

## Explicit Non-Goals

Task2073 does not authorize:

- new route creation
- global route mounting
- `src/app.js`, `src/server.js`, or `public.routes.js` changes
- DB changes or DB execution
- migrations, SQL, seeds, schema, indexes, psql, migration dry-run, or migration apply
- repository query text or parameter changes
- projection service behavior changes
- listener/server startup
- Zeabur, environment, smoke, endpoint, or secret inspection
- provider sending
- admin frontend work
- AI/RAG/model calls
- billing, settlement, payment, or invoice work
- package or lockfile changes
- cleanup, reset, stash, revert, or mutation of the 7 held historical untracked docs

## Verification Plan

Expected verification:

- `node --test tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `git diff --check`
- `git status --short --branch`

DB, migration, smoke, endpoint, Zeabur, environment, and secret inspection commands are not authorized.
