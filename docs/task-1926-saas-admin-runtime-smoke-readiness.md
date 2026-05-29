# Task 1926 - SaaS Admin Runtime Smoke Readiness

## Scope

Task1926 is a readiness-only plan for a future SaaS Admin runtime smoke task.

No smoke test is executed by this task. No Zeabur endpoint is probed. No database is contacted. No deploy is performed. No runtime server is started. No billing provider, payment, invoice, payment method collection, seed, migration, provider sending, AI/RAG execution, Completion Report / Field Service Report behavior, finalAppointmentId mutation, or customer-visible publication behavior is performed.

## Current Branch State

Current Phase 12 SaaS runtime boundaries are in place as pure modules and documentation:

- Task1919 SaaS entitlement readiness inspection exists.
- Task1920 organization entitlement model exists.
- Task1921 usage metering boundary exists.
- Task1922 trial limit guard exists.
- Task1923 billing contact separation guard exists.
- Task1924 SaaS permission contract exists.
- Task1925 SaaS audit boundary exists.

Latest local Task1925 commit at the time this readiness plan was authored:

- `856ad87` - `Task1925 add SaaS audit boundary`

The next runtime smoke task must confirm the deployed commit before executing anything against a target. This document does not confirm deployment.

## Not Executed In Task1926

- No SaaS/admin/billing smoke.
- No `/healthz` probe.
- No public Zeabur endpoint probe.
- No local runtime start.
- No DB-backed runtime path.
- No migration.
- No seed.
- No deploy.
- No Zeabur env change.
- No provider sending.
- No billing provider call.
- No invoice.
- No payment.
- No payment method collection.
- No organization billing DB mutation.
- No AI/RAG provider execution.
- No destructive fixture smoke.
- No secret printing.

## Preconditions Before Task1927

Before any SaaS Admin runtime smoke can run, Task1927 or another explicitly approved task must provide:

- exact approved target URL,
- exact approved target name,
- deployed commit confirmation,
- auth/admin token handling plan that does not print secrets,
- explicit DB target approval if any DB-backed path is scoped,
- seed/test organization approval if test data is needed,
- confirmation that billing provider execution is disabled,
- confirmation that invoice/payment/payment-method behavior remains disabled unless separately approved,
- confirmation that provider/AI sending remains disabled,
- confirmation that Completion Report / FSR behavior is not in scope,
- confirmation that finalAppointmentId mutation is not in scope,
- confirmation that customer-visible publication is not in scope.

If any target, credential, or DB scope is ambiguous, smoke must not run.

## Allowed Future Smoke Categories After Explicit Approval

These categories may be considered only after the exact target is approved:

- `/healthz`
- unauthenticated admin/SaaS route safe-deny, if such a route exists
- permission-denied safe-deny
- pure synthetic local handler only if explicitly scoped
- DB-backed organization entitlement only after target and test-data approval

## Forbidden Future Smoke Actions Without Explicit Approval

The following remain forbidden without a separate explicit approval gate:

- billing provider execution
- payment creation
- invoice creation
- payment method collection
- organization billing DB mutation
- destructive fixture smoke
- seed/migration in the same task
- printing secrets
- AI/provider sending
- Completion Report / Field Service Report behavior
- finalAppointmentId mutation
- customer-visible publication behavior

## Required Task1927 Approval Phrase

Before Task1927 or any SaaS Admin runtime smoke runs, the approval must include the target name exactly:

```text
I approve running SaaS Admin runtime smoke against the explicitly named target: <TARGET_NAME>. Do not use any other target. Do not run DB/migration/seed unless separately approved. Do not execute billing provider, create invoice, create payment, collect payment method, trigger AI/provider sending, Completion Report / FSR behavior, finalAppointmentId mutation, or customer-visible publication.
```

## Readiness Decision

Task1926 prepares the approval gate for future SaaS Admin runtime smoke. It does not authorize Task1927 execution by itself.

Recommended next step after PM acceptance and GitHub sync:

- Ask PM whether to proceed to Task1927 only after an explicit approved target is named, or pause Phase 12 smoke work until deployment/target details are ready.
