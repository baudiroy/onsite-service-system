# Task2223 Repair Intake Draft-to-Case Rate Limit Payload Size Readiness Decision Gate

## Scope

- Adds this no-runtime-change rate limit / payload-size readiness decision gate for the Repair Intake draft-to-case route.
- Adds a focused static guard for the current abuse-protection authorization boundary.
- Does not implement rate limiting, payload-size middleware, body parser policy changes, route changes, DB behavior, smoke, public/open exposure, or provider behavior.
- Does not authorize Task2224 or any future task.

## Current Abuse Protection Boundary

- Current route remains admin/injected-only.
- Current route remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- Current route remains permission-gated by `requirePermission` / `cases.create`.
- Current route is not public/open/customer intake.
- No rate limiting middleware is authorized by this task.
- No payload-size/body-parser policy change is authorized by this task.
- No route exposure or public/open route expansion is authorized by this task.
- Current request DTO sanitizer and final public envelope allowlist remain separate from any future abuse-protection policy.
- Future rate limiting / payload-size policy requires a separate exact PM-authorized task.

## Future Decisions Required Before Rate Limit Payload Size Implementation

- Public/open vs admin/internal scope.
- Per-IP vs per-user vs per-organization rate limit key.
- Authenticated vs unauthenticated handling.
- Request body max size.
- Field-level length limits.
- Attachment/file upload policy if any.
- Retry/backoff headers.
- Logging/audit behavior for throttled requests.
- Failure envelope and reason codes.
- Staging/smoke/production rollout authorization.

## Static Guard Coverage

- `tests/repairIntake/repairIntakeDraftToCaseRateLimitPayloadSizeReadinessDecisionGate.static.test.js` reads source files only.
- The guard asserts the route file remains admin-scoped.
- The guard asserts the route file still references `requirePermission` and `cases.create`.
- The guard asserts no public/open/customer route markers exist in the draft-to-case route file.
- The guard asserts no rate-limit middleware/package imports are added to Repair Intake draft-to-case route/admin/API/controller/application/synthetic boundaries.
- The guard asserts no body-parser/payload-size middleware changes are added to those boundaries.
- The guard asserts the request DTO sanitizer remains an allowlist/denylist sanitizer, separate from rate limit or payload-size middleware policy.
- The guard asserts the final public envelope allowlist remains limited to public result fields and does not grow throttle/retry/limit fields.

## Runtime Authorization Boundary

Task2223 does not authorize Task2224, rate limiting middleware implementation, payload-size/body-parser middleware changes, route changes, auth/session middleware changes, JWT/OAuth/session provider integration, permission model changes, role expansion, organization isolation source changes, public/open/customer route exposure, DB/repository behavior, migrations, SQL execution, audit persistence, smoke probes, provider work, or any future task. PM must authorize one exact task at a time.
