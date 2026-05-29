# Task2059 - Customer-Facing Report Projection Response Allowlist Guard / No DB No Route No Smoke

## PM Decision

Task2058 was accepted. PM requested the next runtime hardening step: add an explicit customer-facing projection response allowlist so no raw DB row, raw service result object, internal field, provider payload, AI draft field, debug field, or arbitrary unknown property can pass through to the public response.

## Runtime Change

- Added `CUSTOMER_SERVICE_REPORT_RESPONSE_KEYS` in `src/customerAccess/customerServiceReportProjectionService.js`.
- Added `customerServiceReportResponseAllowlist()` and routed both projection mapping and allow-envelope creation through it.
- The customer-facing `serviceReport` response now permits only these keys:
  - `customerReportReference`
  - `caseReference`
  - `serviceStatus`
  - `appointmentWindow`
  - `engineerDisplayName`
  - `serviceSummary`
  - `completionTime`
  - `publicAttachments`
- Unknown fields, raw containers, internal notes, provider payloads, AI draft fields, debug fields, token/header fields, raw customer identity fields, and arbitrary row properties remain excluded from response JSON.

## Tests

- Added unit coverage for arbitrary unknown row fields and raw container fields including `row`, `raw`, `payload`, `data.row`, and `reportRow`.
- Added unit coverage for explicit internal/private/debug/identity fields named in the PM task.
- Preserved Task2058 coverage proving `serviceSummary` still comes only from `approved_service_summary`.
- Updated static boundary coverage to require the explicit response key allowlist and reject raw row/result passthrough patterns.

## Scope Guard

- No DB schema or migration changes.
- No repository query changes.
- No route mount, server, or app mount changes.
- No Zeabur, env, or smoke checks.
- No provider sending, LINE, SMS, email, webhook, admin frontend, AI/RAG, billing, settlement, payment, or invoice changes.
- The held historical untracked docs remain untouched.
