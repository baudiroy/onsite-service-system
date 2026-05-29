# Task2016 Public Health And Safe-Deny Smoke Readiness / No Smoke

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 21 - Public Safe-deny Smoke Planning and Execution Gates
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2016-public-health-and-safe-deny-smoke-readiness-no-smoke.md`
- Current synced baseline: `614f8aee289b0d21ce5b758f4c6ebc55295d444a`
- This document is no-smoke planning only.
- This document does not authorize endpoint probes, `/healthz` calls, public route calls, authenticated smoke, DB access, migration, seed, deploy, Zeabur env inspection/change, provider sending, billing provider calls, AI/RAG calls, mutation, customer-visible publication, or secrets handling.

## Candidate Public Smoke Types

| Smoke type | Default status | Required target approval | Allowed future scope after exact approval | Still forbidden without separate approval |
| --- | --- | --- | --- | --- |
| `/healthz` | Paused | Exact target URL, service name, route path, expected status, and expected safe envelope | One public health/readiness request against the exact approved target | Any extra route, DB check, authenticated call, deploy/redeploy/restart, env inspection |
| Public safe-deny routes | Paused | Exact target URL, exact route list or route family, expected denied status/range, and expected safe envelope | Confirming public unauthenticated deny behavior for named routes only | Authenticated allow paths, DB-backed allow paths, writes, provider/billing/AI behavior |
| Unauthenticated route safe-deny | Paused | Exact target URL, route path, expected unauthenticated/forbidden status, and allowed headers | Confirming unauthenticated behavior for named routes only | Token handling, broad route crawling, role/organization exploration, DB mutation |
| App-level 404 safe-deny | Paused | Exact target URL, exact intentionally unknown route, expected 404/denied behavior, and safe envelope expectation | Confirming one intentionally documented app-level not-found or safe-deny response | Treating 404 as route readiness, crawling arbitrary paths, inferring DB/runtime health |

## Required Approval Before Any Public Smoke

Future public smoke must include all of the following before any HTTP request is made:

- Exact target URL, including scheme and host.
- Exact service or target name.
- Exact route list or route path.
- Expected HTTP status or allowed status range.
- Expected response envelope keys or safe text.
- Allowed request headers only.
- Confirmation that no auth tokens, cookies, passwords, private keys, provider keys, or env values are required unless separately scoped.
- Confirmation that the smoke is public-only and does not authorize DB-backed allow paths.
- Confirmation that results will be sanitized and no secrets will be printed.

## Forbidden Actions

The following remain forbidden from this readiness document:

- DB-backed allow-path smoke.
- Authenticated smoke.
- Any DB connection, SQL, migration, or seed.
- Provider sending through LINE, SMS, email, app push, webhook, storage, or other outbound integrations.
- Billing provider calls, invoice creation, payment creation, payment method collection, or charging.
- AI/RAG provider calls.
- Data mutation of any kind.
- `finalAppointmentId` mutation.
- Completion Report / Field Service Report creation, approval, publication, revocation, or mutation.
- Customer-visible publication behavior.
- Deploy, redeploy, restart, rollback, Zeabur env inspection, or Zeabur env changes.
- Printing or storing secrets, tokens, cookies, private keys, provider keys, passwords, connection strings, or env values.
- Broad endpoint discovery, crawling, fuzzing, or route enumeration.

## Stop Conditions For Future Smoke

Any future smoke task must stop immediately if:

- The target URL or route is unclear.
- The response exposes a secret, token, cookie, connection string, private key, provider key, or env value.
- The response exposes raw DB rows, SQL, stack traces, internal paths, or unsanitized error details.
- Any unexpected mutation is observed or required.
- Provider sending, billing behavior, AI/RAG calls, or storage provider calls appear to be triggered.
- The route requires inspecting Zeabur env values or secret-bearing logs.
- Authentication tokens or credentials are requested without a separate exact approval path.
- The smoke would touch customer-visible publication, Completion Report / FSR behavior, or `finalAppointmentId`.
- The target appears to be shared/production and the approval does not clearly authorize that exact target class.

## Recommended First Executable Smoke Task

The recommended first executable smoke task is Task2018 public `/healthz` smoke only after exact target approval.

Task2018 should be separately assigned before any endpoint probe. It should name the target service, target URL, route path, expected status/envelope, and the no-DB/no-provider/no-secret/no-mutation constraints.

## Reporting Requirements For Future Public Smoke

Future public smoke reports should include:

- Target name and public route path.
- Sanitized HTTP status.
- Sanitized response envelope or safe text only.
- Whether the result matched the exact expected status/envelope.
- Confirmation that no DB/migration/seed, authenticated route, provider/billing/AI, deploy, env inspection, mutation, FSR, `finalAppointmentId`, customer-visible publication, or secrets handling occurred.

## Explicit Non-Authorization

This readiness plan is not authorization to run smoke.

Task2018 or a later exact task must be separately approved before any endpoint probe, `/healthz` call, public route call, smoke request, deploy, DB action, provider action, billing action, AI action, mutation, or secret handling.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified by this readiness document.
- No endpoint probe, `/healthz` call, public route call, smoke, DB, SQL, migration, seed, deploy, Zeabur env inspection/change, provider sending, billing provider call, invoice/payment/payment method behavior, AI/RAG call, mutation, or secret inspection was performed.
- The 7 held historical untracked docs were not touched.
