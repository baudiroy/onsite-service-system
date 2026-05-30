# Task2195 Repair Intake Draft-to-Case Permission Gate Pure Decision Helper

## Scope

- Adds a pure permission decision helper for Repair Intake draft-to-case authorization preparation.
- Adds focused unit coverage for malformed input, trusted context requirements, conservative role/source decisions, and client-controlled nested field rejection.
- Does not wire the helper into route, handler, service, controller, repository, or HTTP behavior.

## Decision Contract

The helper accepts trusted server-owned context only:

- `organizationId`
- `actorId`
- `actorRole`
- `repairIntakeDraftId`
- `source`

It returns a normalized decision object with `allowed`, `reasonCode`, and normalized trusted context fields. Reason codes are:

- `allowed`
- `missing_trusted_context`
- `role_not_allowed`
- `invalid_source`

## Conservative Allowlist

- Allowed trusted role: `service_agent`
- Allowed trusted sources: current Repair Intake draft-to-case source values already present in code/tests, including `repair_intake`, synthetic handler/pre-route sources, route handler/adapter composition sources, admin injected test source, and Task2193 trusted route sources.

Client-controlled `requestBody`, `draftInput`, raw body, permission, provider, AI, billing, and audit payload fields cannot authorize conversion.

## Runtime Boundary

This task adds a pure helper, unit tests, and documentation only. It does not change runtime behavior, routes, DB/repository behavior, migrations, package files, providers, AI/RAG, admin frontend, billing, settlement, payments, invoices, servers, smoke probes, endpoint traffic, Customer Access, or Engineer Mobile behavior.

PM must explicitly authorize one exact next task before any Task2196 work begins.
