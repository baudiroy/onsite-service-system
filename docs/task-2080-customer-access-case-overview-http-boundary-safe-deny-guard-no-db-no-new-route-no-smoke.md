# Task2080 - Customer Access Case Overview HTTP Boundary Safe-Deny Guard

## Scope

- Runtime boundary hardening for the existing `GET /customer-access/:caseId` case overview route.
- No new route, no route mount change, no DB execution, no migration, no smoke, no provider/admin/AI/billing work.
- The service report route contract from Task2072-Task2078 remains unchanged.

## Runtime Contract

- `caseId` is accepted only from `request.params.caseId`.
- Query, body, headers, cookies, aliases, raw context, customer IDs, LINE IDs, and nested containers cannot supply or override `caseId`.
- The context middleware snapshots the original route params before applying customer access context so context-derived params cannot replace a missing route param at the controller boundary.
- Missing, empty, non-string, object, array, number, boolean, Date, Error, Buffer-like, thenable, SQL-looking, token/header-looking, or malformed `caseId` values return the existing sanitized safe-deny envelope.
- The case overview controller now builds a narrow DTO for the facade:
  - `caseId`
  - `customerAccessContext`
- The controller does not pass raw `req`, `headers`, `query`, `body`, `cookies`, `params`, `user`, `session`, `socket`, `connection`, auth containers, provider/debug containers, or raw request payloads to the facade.
- `customerAccessContext` is required and must contain a matching safe `params.caseId`.
- Missing, malformed, or mismatched `customerAccessContext` returns the existing sanitized safe-deny envelope.
- Unexpected facade/mapper exceptions fail closed to the same sanitized safe-deny envelope.

## Sanitized HTTP Envelope

Invalid identifier, missing context, malformed context, and unexpected boundary failure use:

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

The HTTP status remains `404` for unavailable/safe-deny case overview responses.

## Verification

- Targeted case overview route/controller/context/static tests cover params-only identifier, DTO allowlist, malformed identifier safe-deny, missing/mismatched context safe-deny, no raw request passthrough, and no raw value leakage.
- No DB commands, migration commands, endpoint smoke probes, Zeabur/env inspection, provider sending, admin frontend, AI/RAG/model, billing, package, or service report route behavior changes are part of this task.
