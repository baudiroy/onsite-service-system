# Task 621 - Customer Access Mounted Route Middleware Stack Test

## Scope

Task 621 added a central-router mounted route middleware stack test only.

Changed files:

- `tests/customerAccess/customerAccessMountedRouteMiddlewareStack.unit.test.js`
- `docs/task-621-customer-access-mounted-route-middleware-stack-test-no-db-no-provider.md`

No runtime source files were changed.

## Test Purpose

The test confirms that the mounted `GET /customer-access/:caseId` route in the central router includes:

1. customer access context middleware
2. customer access controller handler

It then runs the mounted route stack with synthetic requests.

## Coverage

The unit test confirms:

- central router exposes `GET /customer-access/:caseId`
- mounted route contains at least two handlers
- first handler is `customerAccessContextMiddleware`
- final handler is `handleCustomerAccessRequest`
- middleware calls `next()`
- missing context returns generic safe-deny `404`
- synthetic verified context returns HTTP `200` allow envelope
- allow response includes customer-visible service report data
- forbidden/internal fields are filtered
- deny response does not expose internal reason
- output does not expose raw phone/address/LINE id
- `finalAppointmentId` is not modified
- test imports central router only and does not import server bootstrap

## Runtime Boundary

Task 621 did not add or change:

- route source
- controller behavior
- DB access
- repository access
- provider integration
- notification sending
- AI/RAG behavior
- audit writes
- migration
- smoke tests

The endpoint still does not have a DB-backed customer identity resolver or publication access context.

## Invariants Preserved

Task 621 preserves:

- one Case = one formal Field Service Report
- customer-facing report is a filtered publication view
- LINE user id is not a global identity
- no internal data leakage
- organization isolation remains required for future verified context
- no AI auto decision
- no migration/schema/index change
- no sensitive output

## Verification

Planned verification:

- `node --test tests/customerAccess/customerAccessMountedRouteMiddlewareStack.unit.test.js`
- `git diff --check -- tests/customerAccess/customerAccessMountedRouteMiddlewareStack.unit.test.js docs/task-621-customer-access-mounted-route-middleware-stack-test-no-db-no-provider.md`
