# Task2081 - Customer Access Case Overview Facade Result Boundary Guard

## Scope

- Runtime result-boundary hardening for the existing `GET /customer-access/:caseId` case overview route.
- No new route, no route registration change, no global mount, no app/server/public routes change.
- No DB execution, DB connection, query text change, migration, smoke, Zeabur/env inspection, provider sending, admin frontend, AI/RAG/model, billing, or package work.

## Runtime Contract

- The Task2080 controller-to-facade DTO remains:
  - `caseId`
  - `customerAccessContext`
- Facade throw/reject, malformed result, thenable result, class instance, Date, Error, Buffer-like value, array, scalar, null, or undefined returns the existing sanitized case overview safe-deny response.
- Raw facade results are never serialized or spread directly into the HTTP response.
- Valid allow responses are rebuilt through a small allowlist instead of returning the facade object by reference.
- The valid case overview response top-level keys are:
  - `status`
  - `messageKey`
  - `customerVisible`
  - `data`
- The valid `data` key is limited to:
  - `serviceReport`
- The valid `serviceReport` keys are limited to currently accepted customer-facing case overview fields:
  - `caseNo`
  - `finalAppointmentId`
  - `publicReportId`
  - `status`
  - `summary`
- Unknown facade result keys and raw containers such as raw rows, provider payloads, debug/stack/sql/header/token fields, customer raw phone/address, LINE IDs, private/admin-only fields, or raw `customerAccessContext` are omitted from allow responses and never appear in deny responses.

## Sanitized HTTP Envelope

Facade throw/reject, malformed facade result, invalid envelope shape, and unsafe non-allow result use:

```json
{
  "status": "deny",
  "messageKey": "customerAccess.unavailable",
  "customerVisible": false,
  "data": null,
  "error": {
    "messageKey": "customerAccess.unavailable"
  }
}
```

The HTTP status remains `404` for sanitized unavailable responses.

## Verification

- Targeted controller, HTTP adapter, mounted route, and static tests cover valid allow response keys, facade throw/reject, malformed facade results, unsafe nested facade payloads, response allowlisting, Task2080 invalid identifier/context regression, and no raw leak behavior.
- The service report route and route registration contracts remain unchanged.
