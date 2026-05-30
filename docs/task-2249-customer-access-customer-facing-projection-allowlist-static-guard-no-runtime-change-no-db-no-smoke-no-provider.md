# Task2249 - Customer Access Customer-Facing Projection Allowlist Static Guard

Status: static guard only

This task adds a focused static guard for Customer Access / customer-facing projection output allowlists. It freezes the customer-facing projection boundary before future Customer Access runtime work and does not change runtime/source behavior.

Current accepted base:
- `61a7ac75089ca3f77554d4be6555e05d1787a2c1`

## Added Guard

- `tests/customerAccess/customerFacingProjectionAllowlist.static.test.js`

The guard reads source and documentation text only. It does not import Customer Access runtime modules, execute DB code, start a server/listener, call providers, inspect env/Zeabur, or run smoke traffic.

## Coverage

The static guard checks that:

- Customer-facing service-report projection output keys remain explicitly allowlisted.
- Public attachment output keys remain explicitly allowlisted.
- Projection allowlist builders copy approved fields only and do not spread raw rows, repository rows, DB rows, service results, provider payloads, audit rows, AI/RAG results, or arbitrary input data into customer responses.
- HTTP envelope handling validates allowed response keys before serialization.
- Safe-deny / generic not-found behavior remains represented by existing source markers.
- Generic customer access envelope filtering keeps sensitive/internal keys filtered.
- Customer access context and provider identifiers remain scoped and cannot act as broad global identity.
- Task2248 and design docs keep projection-only, safe-deny, customer-visible, and AI/RAG non-bypass guardrails visible.

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

- Run the new static guard directly.
- Re-run relevant existing Customer Access static tests that are obvious from the same boundary area.
- Run text diff hygiene and git status checks.
