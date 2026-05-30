# Task2222 Repair Intake Draft-to-Case Production Auth Session Readiness Decision Gate

## Scope

- Adds this no-runtime-change production auth/session readiness decision gate for the Repair Intake draft-to-case admin route.
- Adds a focused static guard for the current auth/session authorization boundary.
- Does not implement auth/session runtime integration, middleware changes, permission model changes, role expansion, organization isolation source changes, route exposure, DB behavior, smoke, or provider behavior.
- Does not authorize Task2223 or any future task.

## Current Auth and Route Boundary

- Current route remains admin/injected-only.
- Current route remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- Current route remains permission-gated by `requirePermission` / `cases.create`.
- Current trusted actor/context is injected/request-context based and is not a full production auth/session implementation.
- Current organization, actor, role, source, and draft id context remains server-owned and body-scrubbed by existing boundaries.
- No auth/session runtime integration is authorized by this task.
- No permission model change is authorized by this task.
- No role expansion is authorized by this task.
- No organization isolation source change is authorized by this task.
- No public/open/customer route exposure is authorized by this task.
- Future production auth/session integration requires a separate exact PM-authorized task.

## Future Decisions Required Before Production Auth Session Integration

- Session/JWT/token source and validation boundary.
- User/actor identity source.
- Organization/tenant isolation source.
- Role/permission mapping.
- Admin/internal/customer/public scope decision.
- Failure behavior for unauthenticated/unauthorized requests.
- Audit actor attribution.
- Rate limiting / abuse protection relation to auth.
- Staging/smoke/production rollout authorization.

## Static Guard Coverage

- `tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate.static.test.js` reads source files only.
- The guard asserts the route file remains admin-scoped.
- The guard asserts the route file still references `requirePermission` and `cases.create`.
- The guard asserts no public/open/customer route markers exist in the draft-to-case route file.
- The guard asserts no auth/session/JWT/OAuth/passport/firebase/supabase middleware imports enter Repair Intake draft-to-case route/admin/API/controller/application/synthetic boundaries.
- The guard asserts trusted context remains explicit/injected and body-scrubbed by existing boundaries.
- The guard asserts the permission gate remains conservative and does not allow customer/public/self-declared roles.

## Runtime Authorization Boundary

Task2222 does not authorize Task2223, auth/session middleware integration, JWT/OAuth/session provider integration, permission model changes, role expansion, organization isolation source changes, public/open/customer route exposure, DB/repository behavior, migrations, SQL execution, audit persistence, smoke probes, provider work, or any future task. PM must authorize one exact task at a time.
