# Task 665 - Data Correction Permission Middleware Skeleton / No DB / No Route Change

## Scope

Task665 adds a reusable permission middleware skeleton for the Data Correction / Amendment Governance runtime path.

The middleware is intentionally not mounted to any route. It is a bounded permission helper that can be connected by a future route task after the route-level contract is approved.

## Runtime Decision

- `createDataCorrectionPermissionMiddleware()` returns Express-compatible middleware.
- The middleware reads only `req.auth`.
- Allowed requests receive `req.dataCorrectionPermissionContext` with safe metadata only:
  - `organizationId`
  - `userId`
  - `role`
  - `allowedActionTypes`
  - `permissions`
- Denied requests fail closed with:
  - HTTP 403
  - `{ status: 'deny', messageKey: 'dataCorrection.unavailable', data: null }`
- Denial responses do not expose raw reasons, payloads, phone numbers, addresses, LINE identifiers, tokens, secrets, or AI raw payloads.
- Malformed or missing `next` on an allowed path does not throw.

## Permission / Action Mapping

| Action type | Required permission |
| --- | --- |
| `data_correction_request` | `case.correction.request` |
| `pre_departure_apply` | `case.correction.apply` |
| `post_departure_freeze` | `case.correction.request` |
| `unable_to_complete_result` | `appointment.result.record` |
| `follow_up_proposal` | `appointment.follow_up.propose` |

## Role Boundary

- `customer_service`, `dispatch_assistant`, `supervisor`, and `admin` can pass general governance actions when the required permission is present.
- `engineer` can only pass `unable_to_complete_result` when `appointment.result.record` is present.
- `engineer` cannot perform general correction apply by default.
- `ai` actor/role is denied even when permission strings are present.
- Missing `organizationId`, `userId`, `role`, `permissions`, or unknown `actionType` is denied.

## Explicit Non-goals

- No route mount.
- No `src/app.js` or `src/server.js` change.
- No controller change.
- No DB connection.
- No repository, service, provider, transaction, or persistence writer.
- No real permission service integration.
- No audit/contact/dispatch/follow-up writer integration.
- No migration or schema change.
- No API contract change.
- No admin frontend change.
- No smoke, browser, fixture, package, guardrails, short-instruction, design-doc, task-index, or README change.
- No provider, LINE, SMS, Email, App push, notification, AI, RAG, vector, or file storage runtime.

## Coverage Added

The unit coverage verifies:

- Required functions and constants are exported.
- Missing auth is denied with generic 403.
- Missing `organizationId` is denied.
- Missing `userId` is denied.
- Missing `role` is denied.
- Missing permissions are denied.
- `customer_service` with `case.correction.request` can pass `data_correction_request`.
- `dispatch_assistant` with `case.correction.apply` can pass `pre_departure_apply`.
- `supervisor` and `admin` can pass when their required permissions are present.
- `engineer` cannot pass general correction apply by default.
- `engineer` with `appointment.result.record` can pass `unable_to_complete_result`.
- AI role is denied even with permission strings.
- Unknown action type is denied.
- Denied response is generic and does not leak raw denial reason.
- Allowed path sets only safe permission metadata and calls `next` once.
- Malformed `next` does not throw.
- Response and permission context do not leak raw phone, raw address, LINE id, token, secret, internal note, or AI raw payload values.
- Unrelated request fields are not mutated.
- Middleware source has no DB, repository, provider, AI, route, or controller imports.

## Future Tasks

- Connect this middleware to the approved data correction route in a separate bounded route task.
- Add real permission service integration only after the permission contract is approved.
- Add audit/contact/dispatch/follow-up persistence writers in separate bounded tasks.
- Add integration or smoke coverage only after route mounting and persistence boundaries are approved.
- Keep engineer unable-to-complete permission separate from general correction apply.
- Keep AI denied for official correction actions.

## Verification

Planned verification commands:

- `node --check src/dataCorrection/dataCorrectionPermissionMiddleware.js`
- `node --test tests/dataCorrection/dataCorrectionPermissionMiddleware.unit.test.js`
- `git diff --check -- src/dataCorrection/dataCorrectionPermissionMiddleware.js tests/dataCorrection/dataCorrectionPermissionMiddleware.unit.test.js docs/task-665-data-correction-permission-middleware-skeleton-and-unit-tests-no-db-no-route-change.md`
