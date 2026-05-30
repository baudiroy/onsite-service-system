# Task2250 - Customer Access Stale Static Guard Alignment After Projection Allowlist Re-entry

Status: static-test alignment only

This task aligns two stale Customer Access static guards found during Task2249 verification. It updates test expectations to match the currently accepted Customer Access source/test behavior without changing runtime/source behavior.

Current accepted base:
- `4ee317a02ffcf33c93c438a7d860ecdb79b0f290`

## Corrected Static Expectations

- `tests/customerAccess/customerServiceReportProjectionHandlerClosure.static.test.js`
  - The handler import allowlist now matches the accepted handler dependencies:
    - `./customerServiceReportProjectionService`
    - `./customerAccessAuditEventBuilder`
    - `./customerAccessAuditWriterAdapter`
  - The forbidden dependency guard remains in place for routes, controllers, app/server, repositories, transactions, providers, AI/RAG, billing, settlement, migrations, smoke, config/env, logger, network, DB pool creation, and process env access.

- `tests/customerAccess/customerServiceReportProjectionServiceClosure.static.test.js`
  - The stale exact phrase `dbClient query errors fail closed` was replaced with the accepted current unit-test names:
    - `dbClient query throws fail closed without raw error leak`
    - `dbClient query rejects fail closed without rejection reason leak`
  - The guard still requires DB/query failure coverage to prove fail-closed behavior without raw error leakage.

## Guardrails Preserved

- Customer-facing projection allowlists are not weakened.
- Safe-deny behavior is not weakened.
- Customer-visible minimization is not weakened.
- Organization isolation and provider identity boundaries are not weakened.
- No Customer Access runtime/source behavior is changed.

## Non-Authorization Statement

This task does not authorize or perform:

- Runtime/source behavior changes.
- Customer Access route/API/DTO/projection/resolver behavior changes.
- Customer-facing report behavior changes.
- DB commands, SQL execution, SQL runtime construction, transactions, migrations, migration dry-run/apply, DATABASE_URL, Zeabur, env inspection, repository implementation behavior, or audit persistence.
- Route path/mount changes, public/open route mounting, smoke/endpoint probes, server/listener startup, shared runtime, deploy, staging/prod traffic, or `/healthz`.
- Provider sending, auth/session middleware changes, rate-limit/payload-size middleware changes, permission model changes, AI/RAG/OpenAI/vector DB, admin frontend, billing/settlement/payment/invoice, Repair Intake runtime behavior, Engineer Mobile behavior, or package dependency changes.

## Worktree Rule

The same 7 held historical docs remain untracked and untouched. They must not be cleaned, reset, stashed, reverted, staged, or modified unless PM explicitly authorizes that exact action.

## Verification Scope

- Run the two corrected static tests directly.
- Re-run the Task2249 projection allowlist guard.
- Re-run the previously mixed Customer Access static batch.
- Run text diff hygiene and git status checks.
