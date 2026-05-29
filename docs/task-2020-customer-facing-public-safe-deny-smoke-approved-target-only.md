# Task2020 Customer-Facing Public Safe-Deny Smoke / Approved Target Only

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 21 - Public Safe-deny Smoke Planning and Execution Gates
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2020-customer-facing-public-safe-deny-smoke-approved-target-only.md`
- Current synced baseline before this task: `29597162d597db1402c3c3074b061145748f4e76`
- Exact approval received from PM: Customer-facing public safe-deny smoke against the explicitly named target and route only.
- This document records the bounded unauthenticated Customer-facing public safe-deny smoke result only.

## Approved Target

- Approved target URL: `https://onsite-service-api.zeabur.app`
- Approved route path: `/customer-access/smoke_case/service-report/smoke_report`
- Approved endpoint: `GET https://onsite-service-api.zeabur.app/customer-access/smoke_case/service-report/smoke_report`
- Target match result: matched the approved URL and route exactly.

## Endpoint Probed

| Field | Result |
| --- | --- |
| Method | `GET` |
| Endpoint | `https://onsite-service-api.zeabur.app/customer-access/smoke_case/service-report/smoke_report` |
| Authentication | none |
| HTTP status | `404` |
| Content type | `application/json; charset=utf-8` |
| Redirect | none |
| Response body size | 147 bytes |

## Sanitized Response Summary

- Response parsed as JSON: yes.
- Top-level JSON keys only: `customerVisible`, `data`, `error`, `messageKey`, `status`.
- Safe field summary: `status` was `deny`.
- Safe message key summary: `messageKey` was `customerAccess.unavailable`.
- Safe nested error summary: `error.messageKey` was `customerAccess.unavailable`.
- Full raw response was not recorded in this document.
- The result matches the accepted app-level HTTP 404 stealth safe-deny semantics from Task1883A as referenced by PM.
- No credential values, connection strings, provider tokens, private keys, passwords, env values, raw DB rows, raw SQL, stack traces, raw case/appointment/customer data, raw phone/address, `finalAppointmentId`, Completion Report / FSR internals, provider payloads, or billing internals were printed.

## Forbidden Marker Check

| Marker class | Result |
| --- | --- |
| Secret or credential names/values | not detected |
| `DATABASE_URL`, `JWT_SECRET`, provider token, private key, password, or env value exposure | not detected |
| Raw SQL or SQL error text | not detected |
| Raw DB rows/client metadata | not detected |
| Raw case/appointment/customer data | not detected |
| Raw phone/address | not detected |
| `finalAppointmentId` | not detected |
| Completion Report / FSR internals | not detected |
| Provider payloads | not detected |
| Billing internals | not detected |
| Stack trace or internal exception object | not detected |
| Redirect to another target | not detected |

## Route Boundary Confirmation

- Only `GET https://onsite-service-api.zeabur.app/customer-access/smoke_case/service-report/smoke_report` was probed.
- `/healthz` was not called in this task.
- No Engineer Mobile safe-deny route was probed.
- No Repair Intake safe-deny route was probed.
- No Admin Dispatch safe-deny route was probed.
- No Depot Workshop safe-deny route was probed.
- No SaaS route was probed.
- No authenticated route was probed.
- No auth token, cookie, password, or credential was sent.
- No DB-backed route was probed.

## Recommendation

The Customer-facing public safe-deny smoke returned HTTP 404 with `customerAccess.unavailable` and `status=deny`, matching the PM-approved app-level stealth safe-deny expectation. The project is eligible to consider Task2021 later, but Task2021 must be separately assigned and must name the exact target, route list, expected status/envelope, and hard safety boundaries before any additional endpoint probe.

No automatic route expansion, debugging, redeploy, DB-backed smoke, authenticated smoke, customer-visible allow-path check, or broader route check is authorized by this result.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified by this smoke result document.
- No endpoint probes were performed other than the approved Customer-facing route.
- `/healthz` was not called in this task.
- No auth token or authenticated smoke was used.
- No DB, SQL, migration, seed, deploy, redeploy, restart, rollback, Zeabur env inspection/change, provider sending, billing provider call, invoice/payment/payment method behavior, AI/RAG call, DB-backed smoke, mutation, Completion Report / FSR behavior, `finalAppointmentId` mutation, customer-visible publication, or secret inspection was performed.
- The 7 held historical untracked docs were not touched.
