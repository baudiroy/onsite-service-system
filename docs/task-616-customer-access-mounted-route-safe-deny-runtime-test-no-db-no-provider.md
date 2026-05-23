# Task 616 - Customer Access Mounted Route Safe-deny Runtime Test

## Scope

Task 616 added a targeted mounted-route runtime test for the customer access endpoint.

Changed files:

- `tests/customerAccess/customerAccessMountedRouteSafeDeny.unit.test.js`
- `docs/task-616-customer-access-mounted-route-safe-deny-runtime-test-no-db-no-provider.md`

No runtime source files were changed.

## Test Purpose

The test confirms that the customer access route is mounted in the central router after Task 615, while still returning a generic safe-deny response when no future middleware-provided verified context exists.

Covered behavior:

- central router exposes `GET /customer-access/:caseId`
- mounted handler exists and is callable
- missing verified context returns generic safe-deny
- safe-deny uses `404`
- safe-deny uses `customerAccess.unavailable`
- response does not expose internal denial reason codes
- response does not expose raw phone, raw address, or raw LINE user id
- response does not expose Case existence, customer existence, organization mismatch, identity mismatch, or publication reason
- test imports the central router but not the server listen bootstrap

## Runtime Boundary

Task 616 did not add or change:

- route registration
- controller behavior
- DB access
- repository access
- provider integration
- notification sending
- AI/RAG behavior
- audit writes
- migration
- smoke tests

The endpoint still does not have a DB-backed customer identity resolver or publication access context. That remains future work.

## Invariants Preserved

Task 616 preserves:

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

- `node --test tests/customerAccess/customerAccessMountedRouteSafeDeny.unit.test.js`
- `git diff --check -- tests/customerAccess/customerAccessMountedRouteSafeDeny.unit.test.js docs/task-616-customer-access-mounted-route-safe-deny-runtime-test-no-db-no-provider.md`
