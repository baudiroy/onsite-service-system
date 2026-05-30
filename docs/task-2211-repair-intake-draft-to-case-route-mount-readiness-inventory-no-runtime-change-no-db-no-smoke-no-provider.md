# Task2211 Repair Intake Draft-to-Case Route Mount Readiness Inventory

## Scope

- Created a docs-only route mount readiness inventory for the existing Repair Intake draft-to-case path.
- Inspected current Repair Intake docs from Task2187 through Task2210, `src/repairIntake/`, `src/routes/repairIntakeDraftToCase.routes.js`, and existing `tests/repairIntake/` inventory by file listing.
- No runtime/source behavior changed.
- No optional static test was added because this task is an inventory checkpoint and existing Task2187-Task2210 guards already cover the active boundaries.

## Accepted Hardening Summary

- Task2188 and Task2189 established the public/open request DTO allowlist and pure sanitizer helper for draft intake fields.
- Task2190 wired the request DTO sanitizer into the draft-to-case request context path so raw client `draftInput` is sanitized before downstream use.
- Task2191, Task2209, and Task2210 hardened and froze the public response/success envelope allowlist through the public presenter and HTTP mapper.
- Task2192 hardened the service command allowlist so injected service commands are built from server-owned context plus sanitized `draftInput`.
- Task2193 and Task2194 hardened and froze trusted server-owned context sourcing for organization, actor, role, draft id, and source.
- Task2195, Task2196, and Task2197 added and froze the permission gate and safe-deny ordering before injected adapter invocation.
- Task2198 and Task2199 added and froze the permission-denial audit intent boundary through injected writer sinks only.
- Task2200 and Task2201 hardened and froze injected adapter failure safe envelopes.
- Task2203 and Task2204 hardened and froze idempotency key source rules from trusted top-level or header-like context only.
- Task2205 and Task2206 hardened and froze requestId/correlation handling, including body/nested override stripping.
- Task2207 and Task2208 hardened and froze safe audit context propagation.
- Task2187, Task2188, Task2194, Task2197, Task2199, Task2201, Task2204, Task2206, Task2208, and Task2210 provide static guards for key route, request, context, permission, audit, failure, correlation, and public envelope boundaries.

## Current Route Runtime Status

- Existing route mounting remains unchanged.
- The current route file is `src/routes/repairIntakeDraftToCase.routes.js`.
- The current mounted path remains admin/injected-only: `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- The current route still requires `cases.create` through `requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)`.
- Route registration remains gated by route enablement options and injected runtime ports.
- There is no `src/openRepairIntake/`.
- There is no `tests/openRepairIntake/`.
- There is no Repair Intake controller under `src/controllers/`.
- No public/open route expansion has been performed.
- No DB/repository behavior changed in this hardening slice.
- No migration, env, Zeabur, smoke, endpoint probe, provider, AI/RAG, admin frontend, billing, Customer Access, Engineer Mobile, or package work was performed by this inventory.

## Remaining Gaps Before Any Future Route Runtime Exposure

- PM must explicitly decide whether Repair Intake draft-to-case remains admin/injected-only or becomes any public/open intake path.
- If ever exposed beyond the current admin path, auth/session/permission integration must be designed for the real production route.
- Real DB/repository validation boundaries and transaction policy must be confirmed before persistent route exposure.
- Migration/schema needs must be confirmed separately if any new persistent fields are required.
- Audit persistence policy and audit-writer failure mode must be explicitly authorized and tested for the target route.
- Public/open use would need rate limiting, abuse protection, and payload size limits.
- Customer identity, customer contact, and address/privacy rules must be decided before customer-facing exposure.
- Provider and notification behavior remain non-goals unless separately authorized.
- Smoke, staging, and production rollout plans require separate explicit authorization.
- Any public/open route mount, controller addition, or `openRepairIntake` module creation must be a future exact PM-authorized task.

## Verification Plan

- Docs-only verification is sufficient for Task2211.
- Required checks: `git diff --check`, `git diff --cached --check` after staging, and `git status --short --branch`.
- No node tests were added or required because no runtime/source/test behavior changed.

## Runtime Authorization Boundary

This inventory does not authorize Task2212 or any future route/runtime exposure. PM must authorize one exact task at a time.
