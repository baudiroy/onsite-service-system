# Task2213 Repair Intake Draft-to-Case Admin Route Composition Regression Guard

## Scope

- Added a no-runtime-change static regression guard for the existing Repair Intake draft-to-case admin/injected route composition.
- No route was exposed, mounted, expanded, or changed.
- No runtime/source behavior changed.
- No DB, migration, env, Zeabur, smoke, endpoint, server/listener, provider, AI/RAG, admin frontend, billing, Customer Access, Engineer Mobile, or package work was performed.

## Admin Route Composition Guarded

- Current route remains admin-scoped under `/api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- Current route method/path markers remain explicit as `POST` and `REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH`.
- Current route has no public/open/customer exposure markers.
- Permission gating remains `requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)` with `cases.create`.
- Route registration remains gated by explicit route enablement options.
- Route registration still requires injected runtime ports before mount composition.
- Route composition still depends on `createRepairIntakeDraftToCaseInjectedRouteComposition()` and injected `runtimePorts`.
- Route source still avoids direct DB, repository, provider, AI/OpenAI, billing, server/listener, app, or env runtime imports.
- Trusted `draftId` remains derived from route params/path context, not request body.
- Request body context fields such as actor, organization, draft id, request/correlation/idempotency, source, replay, duplicate, and debug fields remain scrubbed before entering the draft-to-case path.

## Static Guard

Added:

- `tests/repairIntake/repairIntakeDraftToCaseAdminRouteComposition.static.test.js`

The guard reads the current route file plus adjacent Task2212 and admin mount tests. It freezes source markers for admin scope, permission gate, enablement gate, injected ports, trusted draft id, body scrubbing, and absence of public/open route expansion markers.

## Runtime Authorization Boundary

Task2213 does not authorize Task2214 or any future route exposure. PM must authorize one exact task at a time.
