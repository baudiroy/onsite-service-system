# Task2074 - Customer Access App Adapter Mount Target Contract Guard

## Purpose

Task2074 hardens the Customer Access service report projection app adapter mount-target boundary.

The adapter remains injected-only. It must not discover or fall back to a global app, route registry, server, listener, environment, DB connector, provider, or runtime bootstrap.

## Guarded App Adapter Boundary

The adapter accepts only an explicitly supplied safe mount target through `app` or `router`.

Supported registration method after this task:

- `get(path, handler)`

Unsupported registration styles remain denied:

- `route().get`
- `register`
- listener-only targets

Malformed targets fail closed without route registration:

- primitives
- arrays
- `Date`
- `Error`
- `Buffer`
- promise-like values
- class instances
- non-function `get`
- throwing getters for target lookup or registration shape
- listener/server-like objects exposing only `listen`

The adapter calls no listener and does not create a DB connection. Importing the adapter does not register routes.

## Guarded Route And Handler Contract

The app adapter route path contract is:

- `GET /customer-access/:caseId/service-report/:reportId`

The registered handler must continue to derive identifiers only from:

- `request.params.caseId`
- `request.params.reportId`

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

Invalid identifiers, invalid or missing context, service safe-deny, service throw or rejection, and malformed service results remain sanitized unavailable 404 safe-deny.

## Files Changed

- `src/customerAccess/customerServiceReportProjectionAppAdapter.js`
- `tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js`
- `tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `docs/task-2074-customer-access-app-adapter-mount-target-contract-guard-no-db-no-new-route-no-smoke.md`

The source change is limited to the app adapter:

- default adapter path now preserves the customer-facing public service report route contract
- mount target lookup is guarded against throwing getters
- safe mount targets must be plain objects with a function `get`
- malformed targets fail closed before handler registration
- registration uses only the captured injected target and `get(path, handler)`

## Explicit Non-Goals

Task2074 does not authorize:

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

- `node --test tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `git diff --check`
- `git status --short --branch`

DB, migration, smoke, endpoint, Zeabur, environment, and secret inspection commands are not authorized.
