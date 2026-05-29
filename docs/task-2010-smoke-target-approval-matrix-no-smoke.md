# Task2010 Smoke Target Approval Matrix / No Smoke

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 20 - Staged Runtime Authorization and Matrix Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2010-smoke-target-approval-matrix-no-smoke.md`
- This document is no-smoke planning only.
- This document does not authorize endpoint probes, smoke execution, DB access, migration, seed, deploy, provider sending, billing provider calls, AI/RAG calls, or secrets handling.

## Approval Principles

- Every smoke must name an exact target URL or target service name.
- Every DB-backed smoke must also name an exact DB target class and data/fixture boundary.
- Approval for one smoke category does not authorize another category.
- Safe-deny smoke does not authorize allow-path smoke.
- Public smoke does not authorize authenticated smoke.
- DB-backed read-only smoke does not authorize DB-backed write smoke.
- Smoke results must be sanitized and must not print tokens, connection strings, passwords, cookies, private keys, provider keys, or env values.

## Smoke Target Approval Matrix

| Smoke category | Default status | Required exact target | Approval phrase template | Allowed only after approval | Still forbidden without separate approval |
| --- | --- | --- | --- | --- | --- |
| Public healthz | Paused | Exact public target URL and service name | `I approve public healthz smoke against <TARGET_NAME> at <TARGET_URL> only. Do not run DB/migration/seed/provider/billing/AI and do not print secrets.` | A single health/readiness request explicitly named by the approval | Any route beyond the approved health endpoint, DB checks, authenticated actions, deploy/redeploy/restart |
| Public safe-deny | Paused | Exact public target URL, route family, and expected safe-deny behavior | `I approve public safe-deny smoke for <ROUTE_FAMILY> against <TARGET_NAME> at <TARGET_URL> only. Do not mutate data and do not print secrets.` | Confirming denied/unauthenticated behavior for named routes only | Authenticated allow paths, DB writes, customer-visible publication, FSR behavior |
| Authenticated safe-deny | Paused | Exact target URL, role/identity type, organization scope, and credential handling outside Codex secrets | `I approve authenticated safe-deny smoke for <ROLE_OR_IDENTITY> on <TARGET_NAME> at <TARGET_URL> only. Credentials will be entered manually or provided through an approved non-printed mechanism.` | Confirming forbidden/limited access for named identity/scope | Printing tokens/passwords, broad role exploration, DB mutation, provider sending |
| DB-backed read-only | Paused | Exact target URL, DB target name/class, organization scope, and read-only route list | `I approve DB-backed read-only smoke for <MODULE> against <TARGET_NAME> at <TARGET_URL> using <DB_TARGET_NAME> only. No writes, no seed, no migration, no secrets printed.` | Read-only API checks for explicitly named module/routes | Any write, seed, migration, destructive fixture setup, customer publication |
| DB-backed write | Paused | Exact target URL, DB target name/class, fixture policy, rollback/cleanup expectations, and allowed write operations | `I approve DB-backed write smoke for <MODULE> against <TARGET_NAME> at <TARGET_URL> using <DB_TARGET_NAME> with <FIXTURE_SCOPE> only. No migration, no seed unless separately approved, no secrets printed.` | Only the named non-destructive write path and fixture scope | Unscoped data mutation, production/shared DB mutation, migration apply, seed, provider/billing/AI |
| Customer-visible allow path | Paused | Exact target URL, customer identity scope, organization scope, and allow-path route | `I approve customer-visible allow-path smoke for <MODULE> against <TARGET_NAME> at <TARGET_URL> using <CUSTOMER_SCOPE> only. Do not publish or mutate customer-visible records unless explicitly listed.` | Named customer-visible read/allow behavior only | Creating, approving, publishing, revoking, or mutating Completion Report / FSR; unfiltered customer data exposure |
| Admin permission route | Paused | Exact target URL, admin role, organization scope, and route list | `I approve admin permission-route smoke for <MODULE> against <TARGET_NAME> at <TARGET_URL> using <ADMIN_ROLE_SCOPE> only. Do not mutate DB unless separately approved.` | Named permission allow/deny checks | Secrets printing, broad admin enumeration, DB-backed writes unless separately approved |
| SaaS entitlement | Paused | Exact target URL, tenant/organization scope, plan/trial scenario, and billing-disabled statement | `I approve SaaS entitlement smoke against <TARGET_NAME> at <TARGET_URL> for <TENANT_OR_PLAN_SCOPE> only. Billing provider calls and payment actions remain forbidden.` | Named entitlement allow/deny checks with billing disabled | Billing provider calls, invoice/payment/payment method creation, real charging, provider secrets |

## Forbidden Smoke Actions Without Explicit Approval

- DB mutation.
- Seed execution.
- Provider sending, including LINE, SMS, email, webhook, storage, or other outbound provider effects.
- Billing provider calls.
- AI/RAG provider calls.
- `finalAppointmentId` mutation.
- Completion Report / Field Service Report creation, approval, publication, revocation, or mutation.
- Customer-visible publication behavior.
- Endpoint probing beyond the exact approved URL/route.
- Zeabur deploy, redeploy, restart, rollback, env changes, or env value inspection.
- Printing or storing secrets, credentials, tokens, private keys, provider keys, or connection strings.

## Result Reporting Requirements For Future Smoke Tasks

- Report target name and route category, not secrets.
- Report sanitized status code and safe outcome only.
- State whether any writes were allowed by the exact approval.
- State whether DB/migration/seed/provider/billing/AI actions were not performed.
- State whether customer-visible and FSR/Completion Report behavior remained untouched.

## Recommended Next Step

Proceed to Task2011 as a no-execution DB migration/seed target approval matrix. Do not run any smoke from this document.
