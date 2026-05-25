# Task795 — Engineer Mobile Permission Guard App Provider Integration / No DB No API Shape Change

## Summary

Task795 wires the Task793 Engineer Mobile permission / assignment guard into the existing read app/provider path as an opt-in synthetic check.

The integration is intentionally narrow:

- no API response shape change
- no route/controller/global app change
- no real DB connection
- no migration / DDL / dry-run / apply
- no audit writer
- no provider sending
- no completion write
- no Field Service Report write
- no `finalAppointmentId` exposure, inference, or mutation
- no AI / RAG runtime

## Implementation

Updated:

- `src/engineerMobile/engineerMobileTaskListService.js`
- `src/engineerMobile/engineerMobileTaskDetailService.js`
- `src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js`

Added:

- `tests/engineerMobile/engineerMobilePermissionGuardAppProvider.unit.test.js`

The list and detail service functions now accept optional injected options:

- `permissionAssignmentGuardEnabled`
- `permissionAssignmentGuard`
- `permissionAssignmentContext`

When the guard is not enabled and no guard function is injected, behavior remains backward compatible.

When the guard is enabled:

- list output is filtered through the injected permission / assignment guard before safe task fields are returned
- detail output is denied before safe detail mapping when the injected guard denies access
- missing guard function or missing permission context fails closed
- denied output remains safe and does not expose provider rows or raw task data

The provider adapter derives synthetic permission context from request auth when no explicit `permissionAssignmentContext` is injected, and forwards the guard options only into the existing safe list/detail service calls.

## Safety Notes

The app/provider path still returns only existing shapes:

- list: `status` / `tasks`
- detail: `status` / `detail`

Denied list access through the app provider remains a safe empty list response. Denied detail access remains the existing not-found / denied envelope. No raw row, stack, SQL, secret, token, raw LINE id, full phone/address, internal note, AI raw payload, billing/settlement internal data, full payload, Field Service Report id, or `finalAppointmentId` is returned.

## Coverage

Added synthetic app/provider tests for:

- assigned engineer allow on task list
- assigned engineer allow on task detail
- unassigned synthetic engineer context denied safely
- cross-organization synthetic context denied safely
- dispatcher / supervisor / admin same-organization synthetic allow
- guard enabled with missing auth context fail-closes
- guard disabled backward compatibility

## Non-goals

Task795 does not implement:

- real permission service
- real assignment resolver
- audit writer
- DB access
- migration
- API shape change
- completion submission
- Field Service Report writes
- `finalAppointmentId` mutation or inference
- provider sending
- AI / RAG
- admin UI
- smoke or integration tests

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobilePermissionGuardAppProvider.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
git diff --check -- src/engineerMobile tests/engineerMobile/engineerMobilePermissionGuardAppProvider.unit.test.js docs/task-795-engineer-mobile-permission-guard-app-provider-integration-no-db-no-api-shape-change.md
```
