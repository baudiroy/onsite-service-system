# Task2061 - Customer-Facing completionTime Safe Timestamp Projection Contract / No DB No Route No Smoke

## PM Decision

Task2060 was accepted with corrected `publicAttachments` item keys: `attachmentId`, `label`, and `mimeType`. PM requested a narrow runtime hardening step for the customer-facing `completionTime` projection so it uses only the intended public completion timestamp source and never falls back to internal lifecycle timestamps, raw row fields, provider payloads, debug data, or arbitrary timestamp properties.

## Runtime Change

- Kept the existing customer-facing `completionTime` response field and accepted response envelope.
- Restricted the customer-visible source field to `completion_time`.
- Added date component validation for completion timestamps so malformed calendar dates and out-of-range time components are omitted.
- Removed projection fallback from `completionTime` and `completed_at`.
- Internal and lifecycle timestamp fields such as `created_at`, `updated_at`, `approved_at`, `published_at`, `submitted_at`, `generated_at`, `internal_completed_at`, `engineer_completed_at`, `appointment_start_time`, and `appointment_end_time` are not used as customer-facing fallbacks.

## Tests

- Added unit coverage proving valid `completion_time` emits the accepted customer-facing `completionTime` value.
- Added unit coverage proving malformed, invalid, non-string, SQL-like, stack-like, token/header-like, and provider-payload-like completion time values are omitted.
- Added unit coverage proving internal and lifecycle timestamp fields are not fallback sources.
- Preserved Task2058 coverage proving `serviceSummary` still comes only from `approved_service_summary`.
- Preserved Task2059 coverage proving the top-level `serviceReport` allowlist remains limited to the accepted customer-facing keys.
- Preserved Task2060 coverage proving `publicAttachments` item keys remain `attachmentId`, `label`, and `mimeType`.
- Updated static boundary coverage to require `completion_time` as the only completionTime source and reject internal timestamp fallback patterns.

## Scope Guard

- No DB schema or migration changes.
- No repository query changes.
- No route mount, server, or app mount changes.
- No Zeabur, env, or smoke checks.
- No provider sending, LINE, SMS, email, webhook, admin frontend, AI/RAG, billing, settlement, payment, or invoice changes.
- The held historical untracked docs remain untouched.
