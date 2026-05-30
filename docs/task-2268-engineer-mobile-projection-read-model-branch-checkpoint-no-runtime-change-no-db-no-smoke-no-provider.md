# Task2268 - Engineer Mobile Projection Read-Model Branch Checkpoint

Status: checkpoint only

## Accepted Outcomes

Task2266 safely re-entered the Engineer Mobile branch with a planning checkpoint after the Customer Access pure helpers closure. It recorded current Engineer Mobile context, guardrails, non-authorized scope, and candidate next work without changing runtime, source, tests, DB, smoke, provider, package, migration, route, or engineer-visible behavior.

Task2267 added a focused static guard for Engineer Mobile projection/read-model allowlist boundaries. The guard reads source, tests, and docs as text only, does not import Engineer Mobile runtime modules, and does not execute DB, repository, route, provider, migration, server, or smoke behavior.

The Task2267 guard now records coverage for:

- explicit task list and task detail read-model field allowlists
- assigned appointment list/detail projection selected-field shaping
- no raw row/source/result/candidate pass-through in known output mappers
- Workbench safe envelope unsafe-key sanitizer coverage
- customer data minimization markers
- assignment, permission, organization scope, and action eligibility markers
- Task2266 planning guardrails and existing Workbench read-only static coverage

## Current Engineer Mobile Guardrail Status

- Engineer Mobile remains organization/tenant isolated.
- Engineer access is based on assignment, permission, and organization scope, not raw client-provided engineer IDs.
- Mobile read models and Workbench output use explicit projection/read-model shaping.
- Known task list/detail and assigned appointment list/detail outputs remain allowlisted.
- Workbench safe envelope unsafe-key sanitizer remains guarded.
- Customer private/contact/address data is minimized and limited to approved work-order context.
- Completion Report / Field Service Report formalization remains protected.
- `finalAppointmentId` remains system-owned and not engineer-controlled.
- Mobile actions require exact workflow eligibility, assignment/permission context, appointment state validation, and explicit state transitions.

## Current Non-Authorized Scope

- No Engineer Mobile route/API/DTO/projection/handler/mobile behavior change is authorized.
- No runtime wiring is authorized.
- No DB, repository, migration, SQL execution, transaction, migration dry-run/apply, DATABASE_URL, Zeabur, or env behavior is authorized.
- No provider sending is authorized.
- No smoke, endpoint probe, server/listener startup, shared runtime, deploy, staging/prod traffic, or `/healthz` behavior is authorized.
- No auth/session/rate-limit/payload-size middleware behavior is authorized.
- No AI/RAG/OpenAI/vector DB behavior is authorized.
- No package dependency change is authorized.
- No Customer Access or Repair Intake runtime behavior change is authorized.
- No admin frontend, billing, settlement, payment, or invoice behavior is authorized.

## Possible Next Engineer Mobile Tasks

These are non-authorized candidates only. PM must still authorize one exact task, allowed files, forbidden scope, and verification commands before any work begins.

- Pure mobile Workbench presenter/helper for a safe assignment/work-order envelope.
- Eligibility/state-transition static guard for mobile visit actions.
- Assignment/permission context source boundary guard.
- Engineer Mobile projection runtime hardening follow-up only if a precise source boundary is selected.
- `docs/design` update only if a new Engineer Mobile rule is introduced.

## Worktree Rule

The same 7 held historical docs remain untracked and untouched. They must not be cleaned, reset, stashed, reverted, staged, or modified unless PM explicitly authorizes that exact action.

## Verification Scope

This checkpoint is docs-only. Verification is limited to:

- `git diff --check`
- `git diff --cached --check` if staged
- `git status --short --branch`
