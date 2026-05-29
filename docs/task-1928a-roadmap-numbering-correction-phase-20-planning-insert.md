# Task1928A Roadmap Numbering Correction and Phase 20 Planning Insert

Status:
- Documentation-only correction note.
- Not authorization to execute Phase 20.
- Not authorization to run DB, migration, seed, smoke, deploy, provider, billing, AI/RAG, customer-visible publication, or production actions.

## Current Baseline

- Task1928 was accepted as the MVP Trial Operation Gate Review.
- Task1928 established that the roadmap has reached a no-DB/no-smoke MVP readiness checkpoint.
- Task1928 did not authorize production launch, live trial operation, deploy, migration, seed, smoke, billing, provider sending, AI/RAG execution, or customer-visible publication.
- `main` was synchronized with `origin/main` at commit `02d6f5f3c500b51ffb3d246630250ba1bf0d98a1`.
- Existing held historical untracked docs must remain untouched.

## Problem Statement

Task1928 recommended a new Phase 20 for staged runtime authorization and smoke execution planning.

The first draft of that recommendation used:

- Task1929 - Staged Deployment and Smoke Target Matrix / No Execution
- Task1930 - Migration and Seed Authorization Matrix / No Execution

That numbering collides with the imported future roadmap packet. The existing roadmap already defines:

- `docs/planning/future-task-master-roadmap-1877-2000/task-1929-ai-assistance-layer-readiness-inspection-no-provider-call.md`
- `docs/planning/future-task-master-roadmap-1877-2000/task-1930-ai-scope-registry-advisory-only.md`

Those existing Task1929 and Task1930 files are Phase 13 AI/RAG draft specs. They must not be overwritten, repurposed, renamed, or executed as Phase 20 staged runtime authorization tasks.

## Decision

- Preserve the existing Task1929 and Task1930 AI/RAG planning specs unchanged.
- Use Task2001+ numbering for Phase 20 staged runtime authorization planning.
- Avoid renumbering the imported future roadmap packet.
- Treat this file as a correction and planning insert only.
- Do not execute Phase 20 from this correction note.

## Corrected Phase 20 Proposal

Add a future planning phase:

- Phase 20 - Staged Runtime Authorization and Smoke Execution Planning

Proposed new task numbers:

- Task2001 - Staged Deployment and Smoke Target Matrix / No Execution
- Task2002 - Migration and Seed Authorization Matrix / No Execution
- Task2003 - Zeabur Deployment Verification Checklist / No Deploy
- Task2004 - Secrets and Environment Variable Readiness Review / No Secrets Printed
- Task2005 - Approved Smoke Execution Batch Plan / No Execution
- Task2006 - MVP Trial Operation Final Go/No-Go Review / No Execution

## Phase 20 Gate Rules

- No DB, migration, or seed command may run without explicit target approval.
- No smoke may run without an exact approved target phrase.
- No Zeabur deploy may run unless separately approved.
- No provider sending may run.
- No billing provider, payment, invoice, or payment method behavior may run.
- No AI/RAG provider execution may run.
- No secrets may be printed.
- All execution tasks must name the exact target and scope.
- Generic "continue", "run next", or similar continuation wording is not authorization for DB, migration, seed, smoke, deploy, provider, billing, AI/RAG, payment, invoice, or customer-visible actions.

## Relationship To Existing Roadmap

- Existing Task1929+ AI/RAG roadmap remains draft-only and not executed by this correction note.
- Existing imported future roadmap files remain the source of truth for their assigned task numbers.
- Phase 20 Task2001+ can be imported later into a new planning packet or created as individual docs after PM/user approval.
- Task1928A is only a numbering correction and Phase 20 planning insert note.

## Proposed Next Batch After Task1928A

Recommended next docs-only batch:

- Task2001 - Staged Deployment and Smoke Target Matrix / No Execution
- Task2002 - Migration and Seed Authorization Matrix / No Execution

Hard stop before any DB, migration, seed, smoke, deploy, provider, billing, AI/RAG, payment, invoice, customer-visible publication, Completion Report / Field Service Report mutation, or `finalAppointmentId` mutation.

## Confirmed Non-Goals

- Do not start Task1929.
- Do not start Task1930.
- Do not start Task2001.
- Do not modify existing Task1929 or Task1930 planning specs.
- Do not modify runtime source.
- Do not modify tests.
- Do not modify package or lockfiles.
- Do not modify admin frontend.
- Do not run DB, SQL, migration, seed, smoke, deploy, runtime server, Zeabur probe, provider integration, billing provider, AI/RAG provider, invoice, payment, or payment method behavior.
- Do not print DATABASE_URL, JWT_SECRET, tokens, private keys, provider keys, passwords, Zeabur secrets, or passphrases.
- Do not create, approve, publish, revoke, or mutate Completion Report / Field Service Report behavior.
- Do not mutate `finalAppointmentId`.
- Do not create customer-visible publication behavior.
- Do not bypass organization isolation.

## Guardrails Preserved

- Organization isolation is mandatory.
- One Case equals one formal Completion Report / Field Service Report.
- `finalAppointmentId` remains backend/system-owned.
- Customer-visible data must be filtered only.
- LINE must not become global identity.
- AI/RAG remains advisory unless explicitly scoped.
- Billing, usage, invoice, payment, and payment method responsibilities remain separated.
- Provider sending remains disabled unless explicitly scoped.
- Existing held historical untracked docs remain untouched.
