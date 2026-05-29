# Task2017 Zeabur Public Endpoint Safe-Deny Approval Packet / No Smoke

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 21 - Public Safe-deny Smoke Planning and Execution Gates
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2017-zeabur-public-endpoint-safe-deny-approval-packet-no-smoke.md`
- Current synced baseline before this batch: `614f8aee289b0d21ce5b758f4c6ebc55295d444a`
- This document is no-smoke planning only.
- This document does not authorize endpoint probes, `/healthz` calls, public route calls, DB access, migration, seed, deploy, redeploy, restart, rollback, Zeabur env inspection/change, provider sending, billing provider calls, AI/RAG calls, invoice/payment/payment method behavior, mutation, customer-visible publication, or secrets handling.

## Known Non-Secret Endpoint Metadata

- Service: `onsite_service`
- Repo: `baudiroy/onsite-service-system`
- Branch: `main`
- Known non-secret domain from prior accepted observation: `onsite-service-api.zeabur.app`

This packet does not assert the current deployed commit. If a future task needs deployed-commit evidence, it must use only accepted non-secret observations and must report `not visible` if Zeabur UI does not safely expose the commit.

## Approval Packet Principles

- This packet is not execution authorization.
- Task2018 or a later exact task must be separately assigned before any endpoint probe.
- Every approval must name the exact target URL and exact route path or route family.
- Approval for `/healthz` does not authorize safe-deny route smoke.
- Approval for public safe-deny does not authorize authenticated smoke.
- Approval for safe-deny does not authorize DB-backed allow paths.
- Secrets/env values must not be inspected, copied, screenshotted, stored, or printed.
- No deploy, redeploy, restart, rollback, Zeabur env change, or Zeabur env inspection is authorized by this packet.

## Approval Phrase Templates

| Future smoke category | Exact approval phrase template | Required fields | Allowed only after approval | Still forbidden |
| --- | --- | --- | --- | --- |
| Public `/healthz` smoke | `I approve public /healthz smoke against <TARGET_NAME> at <TARGET_URL> route <ROUTE_PATH> only. Expected status <EXPECTED_STATUS>. Do not run DB/migration/seed/provider/billing/AI, do not deploy, and do not print secrets.` | `<TARGET_NAME>`, `<TARGET_URL>`, `<ROUTE_PATH>`, `<EXPECTED_STATUS>`, expected safe envelope keys if any | One request to the exact approved health route | Any other route, DB-backed checks, auth, deploy/redeploy/restart, provider/billing/AI, secrets |
| Public safe-deny route smoke | `I approve public safe-deny smoke against <TARGET_NAME> at <TARGET_URL> route <ROUTE_PATH> only. Expected status <EXPECTED_STATUS_OR_RANGE> and envelope <EXPECTED_SAFE_KEYS>. No mutation and no secrets printed.` | `<TARGET_NAME>`, `<TARGET_URL>`, `<ROUTE_PATH>`, `<EXPECTED_STATUS_OR_RANGE>`, `<EXPECTED_SAFE_KEYS>`, forbidden response content | One safe-deny check for the exact route | Authenticated allow path, route crawling, DB writes, customer-visible publication, FSR behavior |
| Branch-specific safe-deny route smoke | `I approve <BRANCH_NAME> public safe-deny smoke against <TARGET_NAME> at <TARGET_URL> route <ROUTE_PATH> only. Expected status <EXPECTED_STATUS_OR_RANGE>. Do not run DB/migration/seed/provider/billing/AI and do not print secrets.` | `<BRANCH_NAME>`, `<TARGET_NAME>`, `<TARGET_URL>`, `<ROUTE_PATH>`, `<EXPECTED_STATUS_OR_RANGE>`, module-specific stop conditions | One branch-specific denied/unauthenticated public check | Any branch allow path, DB-backed behavior, auth token use, mutation, provider/billing/AI |

## Required Fields For Future Approval

Each future public endpoint smoke task must include:

- Target URL, including scheme and host.
- Target service name.
- Route path.
- Smoke category.
- Expected HTTP status or allowed status range.
- Expected safe envelope keys, safe text, or empty-body expectation.
- Forbidden response content.
- Allowed request headers only.
- Confirmation that no auth token, cookie, password, private key, provider key, or env value will be printed.
- Confirmation that no DB/migration/seed, provider/billing/AI, deploy, env inspection, mutation, FSR, `finalAppointmentId`, or customer-visible publication behavior is authorized.

## Forbidden Response Content

Future smoke must stop and report sanitized failure if the response includes:

- Secrets, tokens, cookies, passwords, connection strings, private keys, provider keys, or env values.
- Raw DB rows, SQL text, migration details, stack traces, internal filesystem paths, or unsanitized exception objects.
- Customer data outside the exact approved smoke boundary.
- Provider response payloads from LINE, SMS, email, app push, webhook, billing, AI/RAG, or storage integrations.
- Completion Report / Field Service Report payloads that imply creation, approval, publication, revocation, or mutation.
- `finalAppointmentId` mutation evidence.

## Stop Conditions

Future public endpoint smoke must stop immediately if:

- The target URL, route path, expected status, or expected envelope is unclear.
- The request requires authentication or credentials not separately approved.
- The route requires DB-backed allow-path data.
- The route appears to trigger mutation, provider sending, billing behavior, AI/RAG calls, or storage provider calls.
- The route requires inspecting Zeabur env values or secret-bearing logs.
- The response exposes forbidden content.
- Zeabur prompts for deploy, redeploy, restart, rollback, env changes, or action confirmation.
- The task would touch Completion Report / FSR behavior, `finalAppointmentId`, or customer-visible publication.

## Suggested First Future Approval Packet

For the known service and domain, a future Task2018 approval could use this exact shape after PM/user review:

`I approve public /healthz smoke against onsite_service at https://onsite-service-api.zeabur.app route /healthz only. Expected status 200. Do not run DB/migration/seed/provider/billing/AI, do not deploy, and do not print secrets.`

This example is a template only. It is not active approval and must be repeated in a future assigned task before any endpoint probe.

## Explicit Non-Authorization

This approval packet is not execution authorization.

Task2018 or a later exact task must be separately assigned before any endpoint probe, `/healthz` call, public route call, smoke request, Zeabur observation, deploy/redeploy/restart/rollback, DB action, provider action, billing action, AI action, mutation, or secret handling.

## Non-Actions Confirmed

- No runtime source, package, lockfile, or admin frontend files were modified by this approval packet.
- No endpoint probe, `/healthz` call, public route call, smoke, DB, SQL, migration, seed, deploy, redeploy, restart, rollback, Zeabur env inspection/change, provider sending, billing provider call, invoice/payment/payment method behavior, AI/RAG call, mutation, or secret inspection was performed.
- The 7 held historical untracked docs were not touched.
