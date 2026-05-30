# Task2196 Repair Intake Draft-to-Case Permission Gate Wiring with Safe Deny

## Scope

- Wires the Task2195 pure permission gate into the existing Repair Intake draft-to-case synthetic handler boundary.
- Runs the permission decision after trusted context resolution succeeds and before controller/service adapter invocation.
- Adds focused wiring tests for allowed flow, denial short-circuiting, safe deny envelopes, client-controlled field rejection, and immutability.

## Wiring Boundary

The wiring point is `createRepairIntakeDraftToCaseSyntheticHandler()` in `src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js`.

Flow:

1. Resolve trusted request context.
2. Run `decideRepairIntakeDraftToCasePermission()` on the resolved server-owned context.
3. If denied, return a sanitized safe-deny envelope and do not call the controller adapter.
4. If allowed, continue to the existing adapter input construction and injected controller/service path.

## Deny Mapping

- `missing_trusted_context` maps to `invalid_context` with `REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_MISSING_TRUSTED_CONTEXT`.
- `role_not_allowed` maps to `denied` with `REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED`.
- `invalid_source` maps to `denied` with `REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_INVALID_SOURCE`.
- Unknown denial maps to `denied` with `REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_DENIED`.

Denied envelopes include only sanitized context fields and an empty `draftInput`.

## Runtime Boundary

This is a narrow runtime source change in the injected synthetic handler path only. It does not change route mounting, DB/repository behavior, migrations, package files, providers, AI/RAG, admin frontend, billing, settlement, payments, invoices, servers, smoke probes, endpoint traffic, Customer Access, or Engineer Mobile behavior.

PM must explicitly authorize one exact next task before any Task2197 work begins.
