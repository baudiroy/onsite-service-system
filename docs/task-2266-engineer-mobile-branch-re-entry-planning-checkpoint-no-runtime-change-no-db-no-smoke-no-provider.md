# Task2266 - Engineer Mobile Branch Re-entry Planning Checkpoint

Status: planning checkpoint only

This document prepares a safe Engineer Mobile branch re-entry after the Task2265 PM continuation handoff and accepted Customer Access pure helpers closure. It is docs-only and does not authorize Engineer Mobile runtime, source, test, DB, smoke, route, provider, AI/RAG, package, migration, or engineer-visible behavior changes.

Current accepted base:
- `9809312e5a77fcf480b19ed89b219e5521cc8a51`

## Current Engineer Mobile Context

- Engineer Mobile Workbench remains a priority mobile web / PWA / LIFF-like or installable Web App surface, not a first-step native iOS / Android app.
- Earlier Engineer Mobile work established skeleton, read-only flows, assignment/permission concepts, action eligibility, visit-action hardening, audit side-channel planning, production mount composition, and production readiness packets.
- Current accepted public Engineer Mobile route status and exact runtime behavior must still be confirmed from live code before any future implementation task.
- This checkpoint does not add, remove, mount, probe, or change any Engineer Mobile route.

## Known Engineer Mobile Guardrails

- Engineer Mobile must remain organization/tenant isolated.
- Engineer access must be based on assignment, permission, and organization scope, not raw client-provided engineer IDs.
- Engineer-visible read models, task details, and workbench output must not expose raw Case, Appointment, Completion Report, Field Service Report, repository row, DB row, audit, provider, AI/RAG, billing, settlement, debug, or internal objects beyond explicit mobile projection contracts.
- Completion Report / Field Service Report formalization remains protected: one Case ultimately has one formal Field Service Report, and mobile completion submission is not itself formal report approval.
- `finalAppointmentId` remains system-owned and must not become a normal engineer-controlled field.
- Mobile action paths must require exact workflow eligibility, assignment/permission context, appointment state validation, and explicit state transitions.
- Engineer operations remain appointment / dispatch visit layer operations unless PM explicitly authorizes a different source boundary.
- Mobile output must avoid leaking customer private/contact/address data except explicitly allowed work-order context needed for the assigned visit.
- Provider sending, LINE/SMS/email/app push/webhook behavior, AI/RAG, DB/migration, smoke/staging/prod traffic, package changes, auth/session middleware changes, rate-limit/payload-size changes, and audit persistence remain separately authorized only.
- Product simplicity remains required: Engineer Mobile should minimize field burden and focus on today's tasks, next visit, navigation, arrival/start/work completion actions, photos/evidence, parts/serials, signature/exception, and short completion input.

## Possible Next Engineer Mobile Tasks

These candidates are non-authorized options only. PM must authorize one exact task before any work begins.

- Static guard for Engineer Mobile projection/read-model allowlist.
- Pure mobile workbench presenter/helper for a safe assignment/work-order envelope.
- Eligibility/state-transition static guard for mobile visit actions.
- Assignment/permission context source boundary guard.
- `docs/design` update only if a new Engineer Mobile rule is introduced.

## Recommended Safest Next Candidate

The safest next candidate is a static guard for the Engineer Mobile projection/read-model allowlist.

Rationale:

- It can freeze engineer-visible output boundaries before any new runtime wiring.
- It can stay source/doc/test text-reading only.
- It can preserve assignment/permission, organization isolation, customer data minimization, safe action eligibility, and no provider/DB/smoke boundaries.

This recommendation is not authorization. PM must still authorize the exact task, allowed files, forbidden files, and verification commands before work begins.

## Current Non-Authorized Scope

- No Engineer Mobile route/API/DTO/projection/resolver/mobile behavior change is authorized.
- No Engineer Mobile runtime behavior change is authorized.
- No Customer Access runtime behavior change is authorized.
- No Repair Intake runtime behavior change is authorized.
- No DB, repository, audit persistence, transaction, SQL, migration, migration dry-run/apply, DATABASE_URL, Zeabur, or env behavior is authorized.
- No route mount, open/public route behavior, smoke, endpoint probe, server/listener, shared runtime, deploy, staging/prod traffic, or `/healthz` behavior is authorized.
- No provider sending, auth/session middleware, rate-limit, payload-size/body-parser, permission model, role expansion, organization isolation source, package dependency, AI/RAG/OpenAI/vector DB, admin frontend, billing/settlement/payment/invoice, or Customer Access pure helper wiring is authorized.

## Worktree Rule

The same 7 held historical docs remain untracked and untouched. They must not be cleaned, reset, stashed, reverted, staged, or modified unless PM explicitly authorizes that exact action.

## Verification Scope

- This task is docs-only.
- No source, runtime, or test behavior is changed by this checkpoint.
- Verification is limited to text diff hygiene, staged diff hygiene, and git status.
