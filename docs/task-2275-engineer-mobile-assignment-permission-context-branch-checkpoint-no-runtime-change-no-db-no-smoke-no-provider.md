# Task2275 - Engineer Mobile Assignment Permission Context Branch Checkpoint

Status: checkpoint only

## Accepted Inputs

Task2273 recorded the Engineer Mobile visit-action eligibility branch checkpoint. It connected the safe Workbench envelope checkpoint with the visit-action eligibility/state-transition static guard, confirming that mobile visit actions remain explicit, action-specific, state-gated, assignment/permission scoped, and not authorized by raw client-provided engineer IDs.

Task2274 added the Engineer Mobile assignment, permission, and organization context source boundary static guard. The guard reads source, tests, and docs as text only. It freezes current context source markers for permission assignment, task list/detail request mapping, visit-action evaluator inputs, action policy gates, and request normalizer boundaries without changing runtime/source behavior.

## Current Guarded Engineer Mobile Boundary Status

- Projection/read-model boundaries remain guarded by explicit allowlists.
- The safe Workbench envelope presenter remains guarded as a pure, standalone, engineer-facing helper that is not wired into runtime paths.
- Visit-action eligibility and state-transition boundaries remain guarded by explicit policy registry, action-specific eligibility, appointment-state validation, and explicit transition intent.
- Assignment, permission, and organization context source boundaries are guarded by the Task2274 static test.
- No runtime/source/mobile behavior has changed in this checkpoint.

## Current Assignment Permission Guardrail Status

- Engineer Mobile access/actions are not authorized by raw client-provided engineer IDs.
- Assignment, permission, organization scope, and appointment-state gates remain represented.
- Assignment context is tied to trusted auth, permission, assignment, and task sources, not raw request body, query, header, cookie, session, provider, debug, or env containers.
- Appointment references, case references, and action subjects are not trusted directly from arbitrary request body fields.
- Permission/action eligibility remains separate from customer-visible and Workbench display fields.
- Missing, conflicting, cross-scope, non-assigned, or malformed assignment/permission context remains denied or ineligible.
- Visit-action policies keep organization, permission, assigned engineer, and appointment state gates represented.

## Current Non-Authorized Scope

- No Engineer Mobile route/API/DTO/projection/handler/mobile behavior change is authorized.
- No runtime wiring of the safe Workbench envelope helper is authorized.
- No DB, repository, or audit persistence behavior is authorized.
- No route mount, open route, or public route behavior is authorized.
- No smoke, endpoint probe, server/listener startup, shared runtime, deploy, staging/prod traffic, or `/healthz` behavior is authorized.
- No provider sending is authorized.
- No auth/session middleware, rate-limit middleware, payload-size/body-parser middleware, or package dependency behavior is authorized.
- No permission model, role expansion, or organization isolation source behavior is authorized.
- No AI/RAG/OpenAI/vector DB behavior is authorized.
- No admin frontend behavior is authorized.
- No billing, settlement, payment, or invoice behavior is authorized.
- No Customer Access or Repair Intake runtime behavior change is authorized.

## Possible Next Engineer Mobile Tasks

These are non-authorized candidates only. PM must still authorize one exact task, allowed files, forbidden scope, and verification commands before any work begins.

- Pure visit-action decision/helper if a precise source boundary is selected.
- Bounded runtime wiring of the safe Workbench envelope presenter only if PM explicitly selects the exact source boundary.
- Engineer Mobile projection runtime hardening follow-up only if a precise source boundary is selected.
- Engineer Mobile assignment/permission runtime hardening follow-up only if PM explicitly selects the exact source boundary.
- `docs/design` update only if a new Engineer Mobile rule is introduced.

## Worktree Rule

The same 7 held historical docs remain untracked and untouched. They must not be cleaned, reset, stashed, reverted, staged, or modified unless PM explicitly authorizes that exact action.

## Verification Scope

This checkpoint is docs-only. Verification is limited to:

- `git diff --check`
- `git diff --cached --check` if staged
- `git status --short --branch`
