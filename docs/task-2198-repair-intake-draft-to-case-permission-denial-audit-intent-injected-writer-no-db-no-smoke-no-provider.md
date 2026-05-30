# Task2198 Repair Intake Draft-to-Case Permission Denial Audit Intent

## Scope

- Adds an optional injected permission-denied audit writer boundary to the Repair Intake draft-to-case synthetic handler.
- Emits a sanitized audit intent when the Task2196 permission gate denies conversion.
- Keeps the denied public response behavior from Task2196.

## Audit Boundary

The boundary is in `createRepairIntakeDraftToCaseSyntheticHandler()` after `permissionDeniedEnvelope()` is built and before the denied response is returned.

Supported injected sinks:

- function
- `recordRepairIntakeDraftToCasePermissionDenied()`
- `recordDraftToCasePermissionDenied()`
- `recordPermissionDenied()`
- `record()`

Absence of an audit sink is allowed and does not throw. Audit sink failure is swallowed so raw sink errors never reach the public response.

## Audit Intent Shape

The permission-denied audit intent includes only:

- `eventType`
- `phase`
- `status`
- `outcome`
- `organizationId`
- `actorId`
- `actorRole`
- `repairIntakeDraftId`
- `source`
- `permissionReasonCode`
- `reasonCode`

It excludes raw request/body/draft input, customer contact/address/private fields, provider payloads, AI/RAG fields, billing/settlement/invoice fields, token/password, SQL/debug/internal/stack/raw error data, and any DB or external-service behavior.

## Runtime Boundary

This is a narrow injected runtime boundary change in the synthetic handler only. It does not invoke DB/repository behavior, route mounting, migrations, package changes, providers, AI/RAG, admin frontend, billing, settlement, payments, invoices, servers, smoke probes, endpoint traffic, Customer Access, or Engineer Mobile behavior.

PM must explicitly authorize one exact next task before any Task2199 work begins.
