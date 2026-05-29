# Task2083 - Customer Access Case Overview serviceReport Output DTO Allowlist Guard

## Scope

- Runtime output DTO hardening for the existing `GET /customer-access/:caseId` case overview response.
- No new route, service-report route behavior change, global mount, app/server/public routes change, DB execution, DB connection, migration, query text change, smoke, Zeabur/env inspection, provider sending, admin frontend, AI/RAG/model, billing, or package work.

## Runtime Contract

- The final case overview response keys remain:
  - top-level: `status`, `messageKey`, `customerVisible`, `data`
  - `data`: `serviceReport`
  - `serviceReport`: `caseNo`, `finalAppointmentId`, `publicReportId`, `status`, `summary`
- The controller rebuilds the response from the allowed keys and never serializes or spreads raw facade/serviceReport objects.
- Unknown top-level, data-level, and serviceReport-level fields are omitted.
- Allowed serviceReport keys emit only safe primitive display values:
  - `string`
  - `number`
  - `boolean`
  - `null`
- Malformed allowed-key values are omitted from the output DTO:
  - object
  - array
  - Error
  - Date
  - Buffer-like
  - Promise-like/thenable
  - function
  - class instance
  - SQL-looking string
  - token/header-looking string
  - stack-like string
- Raw containers and operational/internal fields such as raw rows, payloads, report/case/appointment containers, internal/customer/organization IDs, raw phone/address/LINE IDs, engineer/private notes, provider payloads, debug/stack/sql/header/token/auth/session/user/admin-only fields are not emitted.

## Verification

- Targeted controller, HTTP adapter/facade, mounted route, and static tests cover exact response keys, unknown raw key omission, malformed allowed-key value omission, Task2081 result-boundary regression, and Task2082 input/context strict-guard regression.
- The service report route and route registration contracts remain unchanged.
