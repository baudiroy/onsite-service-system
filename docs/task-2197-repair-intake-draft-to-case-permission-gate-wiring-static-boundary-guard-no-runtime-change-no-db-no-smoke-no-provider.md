# Task2197 Repair Intake Draft-to-Case Permission Gate Wiring Static Boundary Guard

## Scope

- Adds a focused static guard for the Task2196 permission gate wiring boundary.
- Freezes the rule that the synthetic handler must run `decideRepairIntakeDraftToCasePermission()` after trusted context resolution and before injected controller/service invocation.
- Does not change runtime/source behavior.

## Guarded Patterns

- `repairIntakeDraftToCaseSyntheticHandler.js` imports the pure permission gate decision helper.
- `createRepairIntakeDraftToCaseSyntheticHandler()` calls the permission gate with the trusted resolver result only.
- Permission denial returns `permissionDeniedEnvelope()` before `createAdapterInput()` or `callControllerAdapter()`.
- The denied path does not invoke the injected controller/service adapter.
- Deny reason codes remain generic and sanitized.
- The deny envelope exposes only sanitized context fields and an empty `draftInput`.
- The pure permission helper does not read nested `requestBody`, `rawBody`, `draftInput`, permission, provider, token/password, billing, or audit payload fields.

## Runtime Boundary

This task adds static test coverage and documentation only. It does not change runtime behavior, routes, DB/repository behavior, migrations, package files, providers, AI/RAG, admin frontend, billing, settlement, payments, invoices, servers, smoke probes, endpoint traffic, Customer Access, or Engineer Mobile behavior.

PM must explicitly authorize one exact next task before any Task2198 work begins.
