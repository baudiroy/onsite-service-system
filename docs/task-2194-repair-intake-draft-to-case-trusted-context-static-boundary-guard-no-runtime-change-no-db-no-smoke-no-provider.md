# Task2194 Repair Intake Draft-to-Case Trusted Context Static Boundary Guard

## Scope

- Adds a focused static guard for the Repair Intake draft-to-case trusted-context boundary from Task2193.
- Freezes the rule that server-owned context must not be derived from client request body, nested `draftInput`, raw request body, or body-level overrides.
- Does not execute Task2195 or any future task.

## Guarded Boundaries

- `resolveRepairIntakeDraftToCaseRequestContext()` keeps `repairIntakeDraftId` sourced from trusted top-level input only.
- `routeLikeInputFromFutureRouterInput()` strips body-level server-owned fields before forwarding route-like body payload.
- `routeLikeToPreRouteInput()` strips body-level server-owned fields before building the pre-route request body.
- `createAdapterInput()` strips nested `draftInput.source` before service command construction.
- `buildAdminRequestLike()` keeps organization and draft context from user/context/route params, with request body server-owned fields removed before forwarding.

## Runtime Boundary

This task adds test and planning documentation only. It does not change runtime/source behavior, DB/repository behavior, migrations, package files, providers, AI/RAG, admin frontend, billing, settlement, payments, invoices, servers, smoke probes, or endpoint traffic.

PM must still explicitly authorize one exact next task before any Task2195 work begins.
