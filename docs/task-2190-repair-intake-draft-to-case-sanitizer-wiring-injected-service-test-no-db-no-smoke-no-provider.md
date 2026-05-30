# Task2190 Repair Intake Draft-to-Case Sanitizer Wiring

## Scope

- Wires the Task2189 pure public/open request DTO sanitizer into the existing Repair Intake draft-to-case request context resolver.
- Adds focused unit coverage proving raw client `draftInput` is sanitized before downstream service/use-case invocation.
- Updates the existing public/open DTO static guard to track the sanitizer wiring marker.

## Boundary

The sanitizer is wired at `resolveRepairIntakeDraftToCaseRequestContext()`, where server-owned `sessionContext` and client-owned `requestBody.draftInput` are already separated. The resolver now returns `draftInput` from `sanitizeRepairIntakePublicOpenRequestDto(requestBody.draftInput || {})`, while `organizationId`, `actorId`, `repairIntakeDraftId`, `source`, and `actorRole` remain server-owned context fields.

## Runtime Change

This is a narrow bounded runtime source change in the existing injected draft-to-case request path. It does not mount or expand any public/open route and does not add a new controller, service, DB path, provider path, AI/RAG path, billing path, or admin frontend behavior.

## Verification Intent

The focused test proves:

- allowed public intake fields are preserved and normalized
- unknown fields are not passed downstream
- client-controlled system fields are not passed downstream
- server-owned context is added separately and is not accepted from client input
- the original request body/input object is not mutated
