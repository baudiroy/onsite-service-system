# Task2247 - Switch Planning Checkpoint for Next Module Branch

Status: planning checkpoint only

This document prepares the next module branch selection after the Repair Intake draft-to-case closure, Task2245 project status portfolio checkpoint, and Task2246 PM continuation handoff. It is a docs-only planning checkpoint and does not authorize any candidate branch by itself.

Current accepted base:
- `77d066a8a5dfbcda47b5dbbe93657d5f05244d04`

## Current Closed Branch State

- Repair Intake draft-to-case runtime hardening is closed for this phase.
- Current route remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- The route remains admin/injected-only.
- The route remains permission-gated by `requirePermission` / `cases.create`.
- No public/open/customer Repair Intake route is authorized by this checkpoint.
- No `src/openRepairIntake/`, `tests/openRepairIntake/`, or Repair Intake controller under `src/controllers/` is authorized by this checkpoint.

## Candidate Branches and First Safe Next-Task Types

All branches below are non-authorized options only. PM must select and authorize one exact task before any work begins.

| Candidate branch | First safe next-task type |
| --- | --- |
| Customer Access / customer-facing report | `docs/design` update or explicit authorization packet before any runtime/customer-visible behavior change. |
| Engineer Mobile | `docs/design` update or static guard around already-defined mobile workbench boundaries before any runtime/mobile behavior change. |
| Depot / Workshop Repair | `docs/design` update or explicit authorization packet defining workflow type, shared Case model boundaries, and non-goals before runtime work. |
| Open/Public Repair Intake design | `docs/design` update first; route scope, customer-visible data policy, abuse controls, and Case-vs-service-request boundary must be decided before runtime work. |
| DB-backed Repair Intake implementation packet | Explicit DB/migration authorization packet first; allowed files, transaction boundary, schema/migration policy, repository behavior, and verification must be named before implementation. |
| Production auth/session packet | Explicit runtime authorization packet first; auth/session source, permission context, organization scope, failure behavior, and checks must be named before implementation. |
| SaaS billing / entitlement | `docs/design` update or explicit authorization packet first; entitlement, permission, seat, usage, subscription, billing, and audit boundaries must stay separate. |
| AI/RAG assistance layer | `docs/design` update or static guard first; closed-domain, permission-aware, tenant-isolated, auditable, human-controlled, and customer-visible/internal data boundaries must be frozen before runtime work. |
| Broader project guardrails/design-doc maintenance | `docs/design` or guardrail maintenance task only if a new cross-cutting rule is being introduced; no runtime approval follows automatically. |

## Planning Recommendation

Future work should prefer bounded runtime implementation where guardrails, allowed files, non-goals, and verification are already clear. The project should avoid staying indefinitely in docs-only readiness reviews when PM can safely authorize a narrow runtime packet with explicit boundaries.

At the same time, docs-only planning remains the correct next step when a module lacks route scope, data visibility policy, permission model, DB/migration authorization, provider boundary, customer-visible behavior, or rollout verification rules.

## Required Guardrails Before Runtime Work

Any future runtime task should state:

- The exact module branch and exact task objective.
- Allowed files and forbidden files.
- Whether backend `src/`, admin frontend, tests, migrations, package files, DB access, smoke tests, provider sending, AI/RAG, deployment, or external network calls are in scope.
- Organization scope, permission, entitlement, audit log, sensitive data, customer-visible data, and SaaS usage boundaries.
- Verification commands and any required smoke/staging/prod constraints.
- What remains explicitly non-goal.

## Non-Authorization Statement

This checkpoint does not authorize Customer Access, Engineer Mobile, Depot / Workshop Repair, Open/Public Repair Intake, DB-backed Repair Intake, production auth/session, SaaS billing / entitlement, AI/RAG, guardrail maintenance, runtime implementation, tests, DB, migration, smoke, provider, route, package, or deployment work.

## Worktree Rule

The same 7 held historical docs remain untracked and untouched. They must not be cleaned, reset, stashed, reverted, staged, or modified unless PM explicitly authorizes that exact action.

## Verification Scope

- This task is docs-only.
- No source, runtime, or test behavior is changed by this checkpoint.
- Verification is limited to text diff hygiene and git status.
