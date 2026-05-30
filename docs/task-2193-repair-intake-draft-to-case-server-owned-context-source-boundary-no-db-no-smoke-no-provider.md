# Task2193 Repair Intake Draft-to-Case Server-Owned Context Source Boundary

## Scope

- Strengthens the trusted source boundary for Repair Intake draft-to-case server-owned context.
- Ensures `organizationId`, `actorId`, `actorRole`, `repairIntakeDraftId`, and `source` do not come from client body or nested `draftInput`.
- Adds focused trusted-context tests.

## Boundary

The inspected and changed boundaries are:

- `resolveRepairIntakeDraftToCaseRequestContext()` in `src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js`
- `routeLikeInputFromFutureRouterInput()` in `src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js`
- `routeLikeToPreRouteInput()` in `src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js`
- `buildAdminRequestLike()` context helpers in `src/routes/repairIntakeDraftToCase.routes.js`

## Final Trusted Context Rule

- `organizationId`: session/user/context only, never body or draftInput
- `actorId`: session/user context only, never body or draftInput
- `actorRole`: session context only, never body or draftInput
- `repairIntakeDraftId`: trusted route/request top-level field derived from route params, never body or draftInput
- `source`: trusted request source field/header pattern, never body or draftInput

For this draft-to-case path, sanitized `draftInput.source` is stripped before context/command output so it cannot be confused with the server-owned command `source`.

## Runtime Boundary

This is a narrow runtime source change in existing request context and route adapter boundaries. It does not create public/open routes, touch DB/repository behavior, start servers, run smoke probes, send providers, add AI/RAG behavior, change billing, alter packages, or touch the 7 held historical docs.
