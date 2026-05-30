# Task2212 Repair Intake Draft-to-Case Production Route Exposure Decision Gate

## Scope

- Added a no-runtime-change decision gate for any future Repair Intake draft-to-case production/public route exposure.
- Added a static guard to prevent accidental public/open route creation or production exposure without explicit PM approval.
- No route was exposed, mounted, expanded, or changed.
- No runtime/source behavior changed.

## Current Route Decision

- The current route remains admin/injected-only.
- The current route is not a public/open intake route.
- The current route file is `src/routes/repairIntakeDraftToCase.routes.js`.
- The current route path remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- The current route remains permission-gated by `cases.create`.
- There is no `src/openRepairIntake/`.
- There is no `tests/openRepairIntake/`.
- There is no Repair Intake controller under `src/controllers/`.
- No public/open route expansion is authorized by Task2212.

## Future Exposure Gate

Any future public/open route exposure requires a separate exact PM-authorized task. Before any such task changes route/runtime behavior, PM must explicitly decide:

- Whether the target scope is admin-only, authenticated internal, customer-authenticated, or public/open.
- Auth/session/permission model for the target route.
- Organization isolation source and whether it comes from session, token claims, route context, or another trusted server-owned source.
- Customer identity, customer contact, and address/privacy rules.
- Rate limiting, abuse protection, and payload size limits.
- DB/repository validation boundary and transaction behavior.
- Migration/schema requirements for any new persistent fields.
- Audit persistence policy and audit writer failure mode.
- Provider/notification non-goals unless separately authorized.
- Smoke, staging, and production rollout authorization.

## Static Guard Coverage

The Task2212 static guard asserts:

- No `src/openRepairIntake/` directory exists.
- No `tests/openRepairIntake/` directory exists.
- No Repair Intake controller exists under `src/controllers/`.
- The draft-to-case route file has no public/open/customer route mount markers.
- The route file remains admin-scoped.
- The route file remains permission-gated with `requirePermission` and `cases.create`.
- No public/open route pattern such as `/public`, `/open`, `/customer`, `/intake/open`, or `/repair-intake/open` appears in the draft-to-case route file.

## Verification Plan

- `node --test tests/repairIntake/repairIntakeDraftToCaseProductionRouteExposureDecisionGate.static.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`

## Runtime Authorization Boundary

Task2212 does not authorize Task2213 or any future production/public route exposure. PM must authorize one exact task at a time.
