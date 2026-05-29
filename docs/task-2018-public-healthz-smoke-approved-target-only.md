# Task2018 Public Healthz Smoke / Approved Target Only

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 21 - Public Safe-deny Smoke Planning and Execution Gates
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2018-public-healthz-smoke-approved-target-only.md`
- Current synced baseline before this task: `7d555d2fda81cf5ab7c4b544757480a70cf72435`
- Exact approval received from PM: public `/healthz` smoke against the explicitly named target only.
- This document records the bounded public `/healthz` smoke result only.

## Approved Target

- Approved target URL: `https://onsite-service-api.zeabur.app`
- Approved endpoint: `GET https://onsite-service-api.zeabur.app/healthz`
- Target match result: matched the approved URL exactly.

## Endpoint Probed

| Field | Result |
| --- | --- |
| Method | `GET` |
| Endpoint | `https://onsite-service-api.zeabur.app/healthz` |
| HTTP status | `200` |
| Content type | `application/json; charset=utf-8` |
| Redirect | none |
| Response body size | 136 bytes |

## Sanitized Response Summary

- Response parsed as JSON: yes.
- Top-level JSON keys only: `ok`, `requestId`, `service`, `timestamp`.
- Full raw response was not recorded in this document.
- No credential values, connection strings, provider tokens, private keys, passwords, env values, raw DB rows, raw SQL, or stack traces were printed.

## Forbidden Marker Check

| Marker class | Result |
| --- | --- |
| Secret or credential names/values | not detected |
| `DATABASE_URL`, `JWT_SECRET`, provider token, private key, password, or env value exposure | not detected |
| Raw SQL or SQL error text | not detected |
| Raw DB rows/client metadata | not detected |
| Stack trace or internal exception object | not detected |
| Redirect to another target | not detected |

## Route Boundary Confirmation

- Only `GET https://onsite-service-api.zeabur.app/healthz` was probed.
- No other public route was probed.
- No customer-facing safe-deny route was probed.
- No Engineer Mobile safe-deny route was probed.
- No Repair Intake safe-deny route was probed.
- No Admin Dispatch safe-deny route was probed.
- No Depot Workshop safe-deny route was probed.
- No SaaS route was probed.
- No authenticated route was probed.
- No DB-backed route was probed.

## Recommendation

The public `/healthz` smoke returned HTTP 200 and did not expose forbidden markers in the sanitized checks. The project is eligible to consider Task2019 later, but Task2019 must be separately assigned and must name the exact target, route family, expected status/envelope, and hard safety boundaries before any additional endpoint probe.

No automatic redeploy, debugging, safe-deny smoke, DB-backed smoke, or broader route check is authorized by this result.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified by this smoke result document.
- No endpoint probes were performed other than `GET https://onsite-service-api.zeabur.app/healthz`.
- No DB, SQL, migration, seed, deploy, redeploy, restart, rollback, Zeabur env inspection/change, provider sending, billing provider call, invoice/payment/payment method behavior, AI/RAG call, authenticated smoke, DB-backed smoke, mutation, Completion Report / FSR behavior, `finalAppointmentId` mutation, customer-visible publication, or secret inspection was performed.
- The 7 held historical untracked docs were not touched.
