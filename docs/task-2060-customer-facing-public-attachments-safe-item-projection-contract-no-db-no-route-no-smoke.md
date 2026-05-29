# Task2060 - Customer-Facing publicAttachments Safe Item Projection Contract / No DB No Route No Smoke

## PM Decision

Task2059 was accepted. PM requested a narrow runtime hardening step for the customer-facing `publicAttachments` projection so each attachment item is emitted only through an explicit public-safe item allowlist and never by passing through raw attachment rows, storage metadata, provider payloads, private upload metadata, internal paths, tokens, headers, or arbitrary unknown properties.

## Runtime Change

- Added `CUSTOMER_PUBLIC_ATTACHMENT_RESPONSE_KEYS` in `src/customerAccess/customerServiceReportProjectionService.js`.
- Added `customerPublicAttachmentResponseAllowlist()` and routed mapped attachment DTOs through it.
- The customer-facing attachment item response now permits only these keys:
  - `attachmentId`
  - `label`
  - `mimeType`
- Existing attachment visibility gates remain in place.
- Missing, malformed, non-array, and invalid attachment collections continue to use the current convention: omit `publicAttachments` when no valid public-safe attachment item remains.
- Unknown item fields and internal/storage/private/provider/debug/token/header fields remain excluded from response JSON.

## Tests

- Added unit coverage proving a valid public attachment is returned with only accepted public-safe keys.
- Added unit coverage proving arbitrary unknown item fields and storage/private/provider/debug/header/token fields do not appear in the response JSON.
- Expanded malformed attachment collection coverage for number values and arrays containing null, non-object, and array items.
- Preserved Task2058 coverage proving `serviceSummary` still comes only from `approved_service_summary`.
- Preserved Task2059 coverage proving the top-level `serviceReport` allowlist remains limited to the accepted customer-facing keys.
- Updated static boundary coverage to require the explicit attachment item allowlist and reject raw attachment passthrough patterns.

## Scope Guard

- No DB schema or migration changes.
- No repository query changes.
- No route mount, server, or app mount changes.
- No Zeabur, env, or smoke checks.
- No provider sending, LINE, SMS, email, webhook, admin frontend, AI/RAG, billing, settlement, payment, or invoice changes.
- The held historical untracked docs remain untouched.
