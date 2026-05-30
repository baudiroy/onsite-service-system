# Task2248 - Customer Access Branch Re-entry Planning Checkpoint

Status: planning checkpoint only

This document prepares a safe Customer Access / customer-facing report branch re-entry after the Task2245 project portfolio checkpoint, Task2246 PM continuation handoff, and Task2247 next-module planning checkpoint. It is docs-only and does not authorize Customer Access runtime, source, test, DB, smoke, route, provider, AI/RAG, package, migration, or customer-visible behavior changes.

Current accepted base:
- `21f958d703374f307514a12e9e65985e0843b56b`

## Current Customer Access Context

- Existing Customer Access docs record production route composition and synthetic/unit/static verification layers.
- Existing accepted Customer Access route contracts include `GET /customer-access/:caseId` and `GET /customer-access/:caseId/service-report/:reportId`.
- Real smoke, server/listener startup, DB execution, migration dry-run/apply, env/Zeabur inspection, provider sending, and production/staging traffic remain separately gated.
- This checkpoint does not add, remove, mount, probe, or change any Customer Access route.

## Known Customer Access Guardrails

- Customer-facing data must be publication/projection only.
- Raw internal Case, Appointment, Field Service Report, Completion Report, repository, DB, audit, provider, AI/RAG, billing, settlement, or runtime objects must not be returned to customer output.
- The one Case to one formal Field Service Report / Completion Report principle remains protected.
- `finalAppointmentId` and internal appointment/workflow state are not customer-controlled.
- Customer identity, contact, address, signature, photo, fee, and report data must be minimized and exposed only when customer-visible and necessary.
- Customer identity/contact/address data must never become a broad global identity key.
- LINE, SMS, app, email, or any provider ID must not be hard-coded as global identity. Provider identities must remain scoped by organization, channel, and verified customer context.
- Organization isolation and permission checks remain required for customer-facing access.
- Customer-visible access should prefer safe deny and generic 404 behavior for unauthorized, missing, malformed, conflicting, or cross-scope access.
- Safe deny must not reveal existence or non-existence of case/report data.
- AI/RAG must not expand customer-visible scope, bypass permission, expose internal data, or query unfiltered database/vector data.
- Audit behavior, if present, must remain side-channel-only and must not leak audit writer results or internal audit data to customer responses.

## Possible Next Bounded Customer Access Tasks

These candidates are non-authorized options only. PM must choose and authorize one exact task before any work begins.

- Static guard for customer-facing projection allowlist.
- Pure presenter/helper for safe customer report envelope.
- Resolver safe-deny behavior test.
- Customer access context source boundary guard.
- `docs/design` update only if a new customer-visible rule is introduced.

## Recommended Safest Next Candidate

The safest next candidate is a static guard for the customer-facing projection allowlist, because it can freeze customer-visible output boundaries before any runtime/customer-facing behavior change. This recommendation is not authorization. PM must still authorize the exact task, allowed files, forbidden files, and verification commands before work begins.

If PM prefers a small implementation step instead of another docs checkpoint, the next task should still stay bounded to a pure helper, presenter, resolver test, or static guard with no DB, no smoke, no provider, no route mount, no server/listener, no env/Zeabur, no migration, and no customer-visible behavior expansion unless explicitly authorized.

## Non-Authorization Statement

This checkpoint does not authorize:

- Customer Access runtime behavior changes.
- Customer-facing API, DTO, projection, presenter, resolver, context source, route, mount, or response behavior changes.
- Source, test, package, migration, DB, repository, audit persistence, provider, smoke, server/listener, deployment, production/staging traffic, AI/RAG, billing, Repair Intake, Engineer Mobile, admin frontend, or SaaS billing behavior changes.
- Any future task from planning packs or historical docs.

## Worktree Rule

The same 7 held historical docs remain untracked and untouched. They must not be cleaned, reset, stashed, reverted, staged, or modified unless PM explicitly authorizes that exact action.

## Verification Scope

- This task is docs-only.
- No source, runtime, or test behavior is changed by this checkpoint.
- Verification is limited to text diff hygiene and git status.
