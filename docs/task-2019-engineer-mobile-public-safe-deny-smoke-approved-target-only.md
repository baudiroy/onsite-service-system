# Task2019 Engineer Mobile Public Safe-Deny Smoke / Approved Target Only

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 21 - Public Safe-deny Smoke Planning and Execution Gates
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2019-engineer-mobile-public-safe-deny-smoke-approved-target-only.md`
- Current synced baseline before this task: `54450274dcbba299503ea9adfae88143cef6c228`
- Exact approval received from PM: Engineer Mobile public safe-deny smoke against the explicitly named target and route only.
- This document records the bounded unauthenticated Engineer Mobile public safe-deny smoke result only.

## Approved Target

- Approved target URL: `https://onsite-service-api.zeabur.app`
- Approved route path: `/engineer-mobile/appointments/apt_public_safe_deny_probe/actions/engineer_mobile.start_travel`
- Approved endpoint: `POST https://onsite-service-api.zeabur.app/engineer-mobile/appointments/apt_public_safe_deny_probe/actions/engineer_mobile.start_travel`
- Target match result: matched the approved URL and route exactly.

## Endpoint Probed

| Field | Result |
| --- | --- |
| Method | `POST` |
| Endpoint | `https://onsite-service-api.zeabur.app/engineer-mobile/appointments/apt_public_safe_deny_probe/actions/engineer_mobile.start_travel` |
| Authentication | none |
| HTTP status | `403` |
| Content type | `application/json; charset=utf-8` |
| Redirect | none |
| Response body size | 71 bytes |

## Sanitized Response Summary

- Response parsed as JSON: yes.
- Top-level JSON keys only: `data`, `messageKey`, `status`.
- Safe field summary: `status` was `deny`.
- Full raw response was not recorded in this document.
- The result matched the preferred safe-deny status range for this task.
- No credential values, connection strings, provider tokens, private keys, passwords, env values, raw DB rows, raw SQL, stack traces, raw appointment/case data, `finalAppointmentId`, Completion Report / FSR internals, or provider payloads were printed.

## Forbidden Marker Check

| Marker class | Result |
| --- | --- |
| Secret or credential names/values | not detected |
| `DATABASE_URL`, `JWT_SECRET`, provider token, private key, password, or env value exposure | not detected |
| Raw SQL or SQL error text | not detected |
| Raw DB rows/client metadata | not detected |
| Raw appointment/case/customer data | not detected |
| `finalAppointmentId` | not detected |
| Completion Report / FSR internals | not detected |
| Provider payloads | not detected |
| Stack trace or internal exception object | not detected |
| Redirect to another target | not detected |

## Route Boundary Confirmation

- Only `POST https://onsite-service-api.zeabur.app/engineer-mobile/appointments/apt_public_safe_deny_probe/actions/engineer_mobile.start_travel` was probed.
- `/healthz` was not called in this task.
- No customer-facing safe-deny route was probed.
- No Repair Intake safe-deny route was probed.
- No Admin Dispatch safe-deny route was probed.
- No Depot Workshop safe-deny route was probed.
- No SaaS route was probed.
- No authenticated route was probed.
- No auth token, cookie, password, or credential was sent.
- No DB-backed route was probed.

## Recommendation

The Engineer Mobile public safe-deny smoke returned HTTP 403 with a sanitized deny envelope and no forbidden markers detected. The project is eligible to consider Task2020 later, but Task2020 must be separately assigned and must name the exact target, route list, expected status/envelope, and hard safety boundaries before any additional endpoint probe.

No automatic route expansion, debugging, redeploy, DB-backed smoke, authenticated smoke, or broader route check is authorized by this result.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified by this smoke result document.
- No endpoint probes were performed other than the approved Engineer Mobile route.
- `/healthz` was not called in this task.
- No auth token or authenticated smoke was used.
- No DB, SQL, migration, seed, deploy, redeploy, restart, rollback, Zeabur env inspection/change, provider sending, billing provider call, invoice/payment/payment method behavior, AI/RAG call, DB-backed smoke, mutation, Completion Report / FSR behavior, `finalAppointmentId` mutation, customer-visible publication, or secret inspection was performed.
- The 7 held historical untracked docs were not touched.
