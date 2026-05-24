# Task1267 - Repair Intake Draft-to-Case Route-Ready Branch Closure / No Runtime Change

Status: local closure checkpoint ready for PM review.

## Scope

Task1267 closes the current Repair Intake draft-to-Case route-ready milestone as documentation only.

This task does not implement more runtime code, does not mount a route, and does not stage or commit this document.

Latest route-adjacent committed milestone:

- `3839cb1 Add repair intake draft-to-case route handler composition test`

## Current Route-Ready But Not Mounted Capability

The route path and method decision is recorded as:

- `POST /internal/repair-intake/drafts/:repairIntakeDraftId/submit-to-case`

The current non-mounted route-ready chain includes:

- route adapter contract
- route handler factory
- pre-route handler factory
- request context resolver
- idempotency policy builder
- audit intent builder
- synthetic handler
- controller adapter contract
- orchestrator
- authorization gate
- application service
- repository consumer
- public presenter
- HTTP result mapper
- full route-handler composition test

## What Is Proven

The committed route-adjacent work proves these boundaries without a real route:

- path `repairIntakeDraftId` wins over any body value
- session organization and actor values win over body override attempts
- idempotency key can be safely taken from an allowlisted header
- raw headers, request objects, and body payloads are not forwarded wholesale
- authorization happens before the repository path
- denied and invalid paths avoid downstream repository execution
- safe `{ statusCode, body, auditIntents, idempotencyPolicy }` output can be produced without a real route
- no DB, cache, audit persistence, or idempotency persistence is required for the tested chain
- tested paths do not leak raw SQL, PII, provider payloads, or internal raw data

## Still Not Implemented

Task1267 confirms the following are still outside the branch:

- no `src/routes/**`
- no `src/controllers/**`
- no `src/app.js` or `src/server.js` mount
- no Express, Fastify, or Koa request/response integration
- no real auth/session/JWT runtime
- no real permission resolver wiring
- no audit writer or audit repository
- no idempotency store or cache
- no DB-backed repository verification
- no migration or DB dry-run
- no smoke execution
- no provider sending
- no customer-visible runtime

## Explicit Next Choices

PM can choose one of the following next branches:

- Option A: push the current committed Repair Intake branch after explicit remote and branch approval
- Option B: implement the real route mount only after explicit approval for the exact route file, app/server mount file, auth/session source, permission resolver, audit/idempotency persistence decisions, DB verification, and smoke scope
- Option C: pause the Repair Intake route line and switch to the appointment/dispatch tests-only branch
- Option D: review or resolve the 8 historical dirty files under a separate exact-subset task

## Dirty Stack Boundary

The same 8 historical dirty tracked files remain outside this branch and must remain untouched unless PM separately authorizes an exact-subset task:

- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `src/repositories/DispatchRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/server.js`
- `src/services/AppointmentService.js`
- `src/services/FieldServiceReportService.js`

## No-Go For Task1267

- no runtime source edits
- no route file creation
- no controller file creation
- no app/server mount
- no real framework request/response integration
- no DB connection
- no migration
- no SQL dry-run
- no smoke execution
- no provider sending
- no AI/RAG call
- no billing or settlement runtime
- no customer-visible runtime rollout
- no real auth/session/JWT runtime
- no token parsing or JWT verification
- no cache or redis write
- no audit persistence
- no staging or commit

## Verification

Required by PM:

- `git log -10 --oneline`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git diff --check`
- `git status --short -- docs/task-1267-repair-intake-draft-to-case-route-ready-branch-closure-no-runtime-change.md`

Expected:

- latest commit remains `3839cb1 Add repair intake draft-to-case route handler composition test`
- staged area remains empty
- tracked diff remains only the same 8 historical dirty files
- this Task1267 document remains untracked and unstaged
- `git diff --check` passes
