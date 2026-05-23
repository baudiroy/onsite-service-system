# Task 617 - Customer Access Mounted Route Allow Runtime Test

## Scope

Task 617 added a mounted-route allow-path runtime test only.

Changed files:

- `tests/customerAccess/customerAccessMountedRouteAllow.unit.test.js`
- `docs/task-617-customer-access-mounted-route-allow-runtime-test-no-db-no-provider.md`

No runtime source files were changed.

## Test Purpose

The test confirms that the mounted `GET /customer-access/:caseId` route can return an allow envelope when future middleware-like verified context is provided synthetically.

Covered behavior:

- central router exposes `GET /customer-access/:caseId`
- mounted handler exists and is callable
- verified synthetic context returns HTTP `200`
- response status is `allow`
- response includes customer-visible service report data
- internal fields are filtered
- raw phone, raw address, raw LINE user id, token, and secret are filtered
- request object is not mutated
- `finalAppointmentId` is preserved, not modified
- test does not import server bootstrap, DB, repository, provider, or AI modules

## Runtime Boundary

Task 617 did not add or change:

- routes
- controller behavior
- DB-backed customer identity resolver
- access repository
- provider integration
- notification sending
- AI/RAG behavior
- audit writes
- migration
- smoke tests

The endpoint still depends on future middleware-provided verified access context and future DB-backed identity/publication checks.

## Safe Publication Boundary

The allow response must only contain customer-visible filtered publication-like data.

Forbidden fields in the synthetic input are filtered from the response, including:

- `internalNote`
- `auditLog`
- `aiRawPayload`
- `internalBillingData`
- `settlementInternalData`
- raw phone/address/LINE id
- token/secret

## Invariants Preserved

Task 617 preserves:

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

- `node --test tests/customerAccess/customerAccessMountedRouteAllow.unit.test.js`
- `git diff --check -- tests/customerAccess/customerAccessMountedRouteAllow.unit.test.js docs/task-617-customer-access-mounted-route-allow-runtime-test-no-db-no-provider.md`
