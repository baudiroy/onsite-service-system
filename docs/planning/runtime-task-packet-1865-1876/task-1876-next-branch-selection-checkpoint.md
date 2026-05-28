# DRAFT PM Task Specification

Status:
- Draft only.
- Not authorization to execute.
- Must not be run unless PM explicitly assigns this exact task.
- Any DB / migration / seed / deploy / smoke action requires separate explicit approval.

Global restrictions:
- Do not print `DATABASE_URL`, `JWT_SECRET`, tokens, private keys, provider keys, passwords, passphrases, or Zeabur secrets.
- Do not touch LINE / OpenAI / R2 provider integrations unless a specific future task explicitly scopes them.
- Do not create or publish Completion Report / Field Service Report.
- Do not mutate `finalAppointmentId`.
- Do not create customer-visible publication behavior.
- Do not bypass organization isolation.
- Do not touch the 7 held historical untracked docs.
- Do not run DB / migration / seed / deploy / smoke unless the exact assigned task explicitly allows it and PM/user approval is present.

# Task1876 — Next Branch Selection Checkpoint

## Phase

Phase 7 — Next Branch Selection / 下一條功能線選擇.

## Goal

Decide the next major runtime branch after the Engineer Mobile visit action branch.

Planning only.

## Candidate branches

1. Customer-facing report publication.
2. Repair Intake to Case runtime.
3. Depot / Workshop repair.
4. Admin/frontend operational workflows.
5. SaaS trial / usage / billing / entitlement.
6. Customer AI scope and RAG-assisted field-level support.
7. Open Repair Intake.

## Decision criteria

Evaluate each candidate by:

- User/business value.
- Runtime readiness.
- DB/migration risk.
- Customer-visible data risk.
- Organization isolation risk.
- Permission/audit requirements.
- Zeabur/deployment dependency.
- Whether existing guardrails/design docs are sufficient.
- Whether a bounded runtime task can start immediately.

## Output

Recommend one next branch and one first bounded task.

Do not create a long docs-only branch unless the next branch involves major unresolved architecture, AI/RAG, customer-visible data, organization isolation, SaaS entitlement, billing/settlement, or permission model changes.

## Completion report must include

- Candidate comparison.
- Recommended next branch.
- First bounded task proposal.
- Explicit non-goals.
- Confirmation planning only.
- Confirmation no runtime/DB/migration/deploy/seed/provider actions.
- Confirmation no secrets printed.
