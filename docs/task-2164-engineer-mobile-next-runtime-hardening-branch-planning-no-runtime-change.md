# Task2164 - Engineer Mobile Next Runtime Hardening Branch Planning / No Runtime Change

## Scope

Task2164 plans the next bounded Engineer Mobile runtime hardening branch. This is docs-only. It does not modify runtime, source, tests, packages, routes, app/server composition, DB, migrations, smoke, env/Zeabur, providers, admin frontend, AI/RAG/model, billing, payment, customer-facing DTOs, or engineer-visible DTOs.

## Customer Access Stopping Point

Customer Access is currently paused at a readiness/smoke-authorization boundary:

- Customer Access public routes are wired through production route composition.
- Customer Access smoke is authorized only by packet, not executed.
- Audit migration exists but has not been run, dry-run, or applied.
- DB execution remains not authorized.
- Production/staging smoke remains not executed.
- Customer Access is a candidate for future smoke only with explicit authorization.

## Known Engineer Mobile Branch Status

Earlier accepted work established Engineer Mobile Workbench skeleton, read-only flows, eligibility guards, and visit-action hardening. Exact latest runtime state must still be confirmed by code inspection before any future implementation task.

Future Engineer Mobile runtime work must preserve:

- one Case equals one formal completion report / field service report principle
- Appointment lifecycle remains separate from Case and Completion Report
- no `finalAppointmentId` mutation unless explicitly authorized
- no provider sending unless explicitly authorized
- no DB/migration unless separately authorized
- no global app/server mount without production mount readiness
- engineer-visible DTO must not expose raw customer phone/address/private fields

If the exact latest Engineer Mobile task state is uncertain, the next runtime branch must begin with code inspection/static baseline, not broad implementation.

## Candidate Branches - Not Authorized

Candidate A:

- Engineer Mobile production mount composition adapter skeleton / no server no DB no smoke

Candidate B:

- Engineer Mobile action audit side-channel planning / no runtime integration

Candidate C:

- Engineer Mobile visit-action HTTP behavior surrogate / no server no DB

Candidate D:

- Engineer Mobile completion report handoff/readiness review

Candidate E:

- Engineer Mobile mobile workbench DTO allowlist regression guard

All candidates are planning options only and do not authorize implementation.

## Recommended Next Exact Task

Recommended next exact Engineer Mobile task:

- Engineer Mobile Production Mount Composition Adapter Skeleton / No Server No DB No Smoke

Rationale:

- mirrors the accepted Customer Access production mount composition pattern
- avoids app/server/global mount changes
- keeps DB, smoke, and provider sending out of scope
- prepares future production route composition safely
- provides a narrow seam for later static and HTTP behavior guards

## Future Engineer Mobile Production Mount Adapter Requirements

A future adapter skeleton should require:

- injected-only router or mount target
- no app/server/global fallback
- no listener/server startup
- no DB connection/query during registration
- no provider sending
- no app push/SMS/LINE/email sending
- sanitized registration summary only
- no raw router/dbClient/provider/session/auth/customer PII leakage
- internal/test routes must not be public-mounted

## Future Engineer Mobile Audit Planning Requirements

Future audit planning should require:

- audit writer optional and injected only
- audit failure must not alter engineer-facing HTTP response
- no raw customer identity, private notes, provider/debug payload, SQL, or token data in audit event
- audit persistence remains separate and is not implied by audit side-channel planning

## Explicit Non-Goals

- no runtime/source/test changes except this doc
- no Engineer Mobile production mount
- no app/server/public routes changes
- no DB/migration/SQL
- no smoke/server/listener/network
- no provider sending
- no admin frontend
- no AI/RAG/model calls
- no billing/payment work
- no customer-visible or engineer-visible DTO changes
- no Customer Access smoke execution

## Suggested Future Sequence

1. Start with Engineer Mobile production mount composition adapter skeleton / no server no DB no smoke.
2. Add focused regression guards for injected mount behavior and no side effects.
3. Create a branch checkpoint before any production route composition implementation.
4. Require an explicit authorization packet before any app/server/global mount work.
5. Keep DB, provider sending, smoke, and audit persistence implementation in separate tasks.

PM must still authorize one exact task at a time.
