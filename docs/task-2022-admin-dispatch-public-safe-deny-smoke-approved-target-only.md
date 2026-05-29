# Task2022 Admin Dispatch Public Safe-Deny Smoke / Approved Target Only

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 21 - Public Safe-deny Smoke Planning and Execution Gates
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2022-admin-dispatch-public-safe-deny-smoke-approved-target-only.md`
- Current synced baseline before this task: `7cc4d57602b07b603e5ba623cbccc6646d6d4db8`
- Exact approval received from PM: Admin Dispatch public safe-deny smoke against the explicitly named target and route only.
- This document records the bounded unauthenticated Admin Dispatch public safe-deny smoke result only.

## Approved Target

- Approved target URL: `https://onsite-service-api.zeabur.app`
- Approved route path: `/api/v1/admin/dispatch-assignments/assign_public_safe_deny_probe/assignment-intent`
- Approved endpoint: `PATCH https://onsite-service-api.zeabur.app/api/v1/admin/dispatch-assignments/assign_public_safe_deny_probe/assignment-intent`
- Target match result: matched the approved URL and route exactly.

## Endpoint Probed

| Field | Result |
| --- | --- |
| Method | `PATCH` |
| Endpoint | `https://onsite-service-api.zeabur.app/api/v1/admin/dispatch-assignments/assign_public_safe_deny_probe/assignment-intent` |
| Authentication | none |
| Request body keys | `targetEngineerId` |
| Request IDs | fake probe values only |
| HTTP status | `404` |
| Content type | `application/json; charset=utf-8` |
| Redirect | none |
| Response body size | 216 bytes |

## Sanitized Response Summary

- Response parsed as JSON: yes.
- Top-level JSON keys only: `error`.
- Safe field summary: an `error` field was present, but its full value was not printed.
- Full raw response was not recorded in this document.
- The result was not HTTP 500.
- No credential values, connection strings, provider tokens, private keys, passwords, env values, raw DB rows, raw SQL, stack traces, appointment/customer/case data, `finalAppointmentId`, Completion Report / FSR internals, provider payloads, billing internals, or AI output were printed.

## Safe-Deny Classification

The response indicates an app-level JSON 404 not-found style response for the approved unauthenticated Admin Dispatch route.

Because the sanitized summary exposed only the top-level `error` key and no route-specific `status` or `messageKey`, this task classifies the result as an app-level not-found / intentionally-unmounted style safe response, not as a route-specific Admin Dispatch safe-deny envelope.

If PM requires stronger proof that the route is intentionally unmounted rather than unexpectedly missing, the next step should be a bounded route/deployment observation task. This result does not authorize an automatic fix, redeploy, restart, DB action, assignment mutation, appointment mutation, or broader endpoint probe.

## Forbidden Marker Check

| Marker class | Result |
| --- | --- |
| Secret or credential names/values | not detected |
| `DATABASE_URL`, `JWT_SECRET`, provider token, private key, password, or env value exposure | not detected |
| Raw SQL or SQL error text | not detected |
| Raw DB rows/client metadata | not detected |
| Raw assignment, appointment, case, or customer data | not detected |
| `finalAppointmentId` | not detected |
| Completion Report / FSR internals | not detected |
| Provider payloads | not detected |
| Billing internals | not detected |
| AI output | not detected |
| Stack trace or internal exception object | not detected |
| Redirect to another target | not detected |

## Route Boundary Confirmation

- Only `PATCH https://onsite-service-api.zeabur.app/api/v1/admin/dispatch-assignments/assign_public_safe_deny_probe/assignment-intent` was probed.
- `/healthz` was not called in this task.
- No Engineer Mobile safe-deny route was probed.
- No Customer-facing safe-deny route was probed.
- No Repair Intake safe-deny route was probed.
- No Depot Workshop safe-deny route was probed.
- No SaaS route was probed.
- No authenticated route was probed.
- No auth token, cookie, password, or credential was sent.
- No DB-backed route was probed.

## Recommendation

The Admin Dispatch public safe-deny smoke returned HTTP 404 JSON without forbidden markers and without evidence of assignment mutation, appointment mutation, provider sending, billing, AI, FSR behavior, or data exposure.

If PM accepts the app-level not-found / intentionally-unmounted style response as sufficient for this phase, the project is eligible to consider Task2023 later. If PM expected a route-specific Admin Dispatch safe-deny envelope, the next task should be bounded route/deployment observation only, with no automatic fix or redeploy.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified by this smoke result document.
- No endpoint probes were performed other than the approved Admin Dispatch route.
- `/healthz` was not called in this task.
- No auth token or authenticated smoke was used.
- No assignment was mutated.
- No appointment was mutated.
- No DB, SQL, migration, seed, deploy, redeploy, restart, rollback, Zeabur env inspection/change, provider sending, billing provider call, invoice/payment/payment method behavior, AI/RAG call, DB-backed smoke, mutation, Completion Report / FSR behavior, `finalAppointmentId` mutation, customer-visible publication, or secret inspection was performed.
- The 7 held historical untracked docs were not touched.
