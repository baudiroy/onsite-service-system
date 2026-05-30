# Task2192 Repair Intake Draft-to-Case Service Command Boundary Allowlist

## Scope

- Strengthens the Repair Intake draft-to-case command boundary before invoking the injected controller/service.
- Ensures the command is built from server-owned context plus a Task2189/Task2190 sanitized `draftInput`.
- Adds focused command boundary tests.

## Boundary

The changed boundary is `createAdapterInput()` in `src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js`.

This is where the resolved request context is converted into the command passed to the injected controller adapter/service. The top-level command was already explicitly shaped; Task2192 adds a final `draftInput` sanitizer call at this boundary.

## Final Command Allowlist

Top-level command fields:

- `organizationId`
- `actorId`
- `repairIntakeDraftId`
- `source`
- `actorRole`
- `draftInput`

Nested `draftInput` fields:

- `customerDisplayName`
- `customerContactIntent`
- `customerContactMethod`
- `serviceCategory`
- `problemDescription`
- `preferredTimeDescription`
- `addressDescription`
- `source`
- `consentConfirmed`

## Runtime Boundary

This is a narrow runtime source change in the existing injected synthetic handler command boundary. It does not create public/open routes, touch DB/repository behavior, start servers, run smoke probes, send providers, add AI/RAG behavior, change billing, alter packages, or touch the 7 held historical docs.
