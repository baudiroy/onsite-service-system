# Task2278 - Engineer Mobile Visit Action Decision Helper Branch Checkpoint

Status: checkpoint only

## Accepted Inputs

Task2275 recorded the Engineer Mobile assignment, permission, and organization context checkpoint. It confirmed that Engineer Mobile access/actions are not authorized by raw client-provided engineer IDs, that assignment/permission/organization and appointment-state gates remain represented, and that no runtime/source/mobile behavior changed.

Task2276 added `decideEngineerMobileVisitAction(input)` as a pure Engineer Mobile visit-action decision helper. The helper accepts trusted permission context, trusted assignment context, an action name, and an already-safe action subject / appointment state. It returns a new decision object with generic deny/ineligible output or an allowed decision with explicit transition intent.

Task2277 added a text-reading static boundary guard for the Task2276 helper. The guard freezes helper exports, import boundaries, supported actions, canonical aliases, safe allow shape, allowed-only transition intent, raw request-container rejection, report-boundary protection, and no-runtime/no-DB/no-provider/no-AI/no-billing dependency boundaries.

## Current Engineer Mobile Visit-Action Decision Status

- The visit-action decision helper is pure and standalone.
- The helper is not wired into any route, handler, DTO, repository, workflow, runtime, provider path, or mobile runtime path.
- The helper accepts trusted permission context, trusted assignment context, action name, and already-safe action subject / appointment state.
- Supported actions are explicit: `start_travel`, `arrive`, `start_work`, `finish_work`, and `record_visit_result`.
- Canonical `engineer_mobile.*` action aliases remain accepted only through explicit mapping.
- Allow decision shape is explicit and safe: `allowed`, `status`, `reasonCode`, `action`, `assignmentReference`, `appointmentReference`, and `transitionIntent`.
- Transition intent is explicit and emitted only for allowed actions.
- Deny/ineligible decisions are generic and do not expose raw objects or internals.
- Raw client-provided engineer IDs and raw request body, query, header, cookie, session, provider, debug, or env containers are not trusted.
- Report-boundary protections remain in place.
- Field Service Report and Completion Report create, approve, publish, and formalize behavior remains absent.
- `finalAppointmentId` remains system-owned and is not accepted from input or emitted.

## Current Non-Authorized Scope

- No Engineer Mobile route/API/DTO/projection/handler/mobile behavior change is authorized.
- No runtime wiring of the visit-action decision helper is authorized.
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

- Pure visit-action command envelope/helper if a precise source boundary is selected.
- Bounded runtime wiring of the visit-action decision helper only if PM explicitly selects the exact source boundary.
- Bounded runtime wiring of the safe Workbench envelope presenter only if PM explicitly selects the exact source boundary.
- Engineer Mobile projection runtime hardening follow-up only if a precise source boundary is selected.
- `docs/design` update only if a new Engineer Mobile rule is introduced.

## Worktree Rule

The same 7 held historical docs remain untracked and untouched. They must not be cleaned, reset, stashed, reverted, staged, or modified unless PM explicitly authorizes that exact action.

## Verification Scope

This checkpoint is docs-only. Verification is limited to:

- `git diff --check`
- `git diff --cached --check` if staged
- `git status --short --branch`
