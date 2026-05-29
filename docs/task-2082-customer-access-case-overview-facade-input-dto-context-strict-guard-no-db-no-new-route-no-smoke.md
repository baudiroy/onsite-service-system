# Task2082 - Customer Access Case Overview Facade Input DTO and Context Strict Guard

## Scope

- Runtime input-boundary hardening for the existing `GET /customer-access/:caseId` case overview path.
- No new route, service-report route behavior change, global mount, app/server/public routes change, DB execution, DB connection, migration, query text change, smoke, Zeabur/env inspection, provider sending, admin frontend, AI/RAG/model, billing, or package work.

## Runtime Contract

- The case overview controller-to-facade DTO remains exactly:
  - `caseId`
  - `customerAccessContext`
- Invalid controller input or invalid/malformed `customerAccessContext` fails closed before the injected facade is called.
- The HTTP context adapter accepts only a plain DTO with a safe top-level `caseId` and a plain `customerAccessContext`.
- `customerAccessContext.params.caseId` must be a safe string and must match the top-level `caseId`.
- The context sections accepted for mapping are:
  - `params`
  - `auth`
  - `channel`
  - `access`
  - `customerVisibleData`
- Identifier fields must be safe strings after trim. SQL-looking, token/header-looking, empty, too long, non-string, Date, Error, Buffer-like, thenable, array, and class-instance values fail closed.
- Policy flags must be exact booleans. String/numeric/object/array/null/undefined flag values do not authorize.
- Raw input aliases, wrappers, request containers, auth/session/header/cookie/token fields, raw customer identifiers, debug/stack/sql/provider payloads, and private/admin-only fields are not emitted in response JSON.

## Safe-Deny Envelope

Invalid input, invalid context, and case mismatch use the existing sanitized unavailable envelope:

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

The HTTP controller maps this envelope to `404`.

## Verification

- Targeted controller, HTTP facade, HTTP context adapter, mounted route, and static tests cover the exact DTO keys, strict context shape, invalid identifier/context/mismatch fail-closed behavior, boolean validation, raw non-leakage, and Task2080/Task2081 regressions.
- The service report route and route registration contracts remain unchanged.
