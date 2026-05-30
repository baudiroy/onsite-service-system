# Task2199 Repair Intake Draft-to-Case Permission Denial Audit Intent Static Boundary Guard

## Scope

- Adds a static boundary guard for the Task2198 permission-denied audit intent path.
- Freezes the injected audit sink names, denied-branch ordering, audit writer failure behavior, and sanitized audit intent shape.
- Does not change runtime/source behavior.

## Guarded Patterns

- Permission-denied branch stays inside `createRepairIntakeDraftToCaseSyntheticHandler()`.
- Permission denial happens before `createAdapterInput()` and before injected controller/service adapter invocation.
- Denied path writes only through the injected permission-denied audit sink boundary.
- Supported sink names remain explicit: function sink, `recordRepairIntakeDraftToCasePermissionDenied()`, `recordDraftToCasePermissionDenied()`, `recordPermissionDenied()`, and `record()`.
- Missing audit writer returns without throwing.
- Audit writer failure is swallowed and cannot alter or leak into the public deny envelope.
- Audit intent shape remains limited to safe event/context/reason fields.
- Audit path does not read raw request/body/draft input or private/system payload fields.

## Runtime Boundary

This task adds static test coverage and documentation only. It does not change runtime behavior, routes, DB/repository behavior, migrations, package files, providers, AI/RAG, admin frontend, billing, settlement, payments, invoices, servers, smoke probes, endpoint traffic, Customer Access, or Engineer Mobile behavior.

PM must explicitly authorize one exact next task before any Task2200 work begins.
