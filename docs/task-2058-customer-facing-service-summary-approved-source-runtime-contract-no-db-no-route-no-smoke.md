# Task2058 - Customer-Facing serviceSummary Approved Source Runtime Contract / No DB No Route No Smoke

## PM Decision

PM selected Option B from Task2056:

- `serviceSummary` must not remain generic free text.
- Customer-facing `serviceSummary` may be emitted only from the approved public-safe source field `approved_service_summary`.

## Runtime Change

- Updated `src/customerAccess/customerServiceReportProjectionService.js` so the customer-facing service report projection query selects `approved_service_summary`.
- Updated the service report DTO mapper so `serviceSummary` reads only `approved_service_summary`.
- Removed the previous runtime fallback from `serviceSummary` and `service_summary` into customer-facing output.
- Added a conservative malformed/unsafe summary filter for non-string, empty, SQL-looking, token/header-looking, stack-like, provider-payload, internal-note, AI-draft, completion-note, diagnosis-note, and private-report-body strings.

## Tests

- Updated customer-facing projection, handler, route, adapter, and full-route synthetic tests to use `approved_service_summary` as the approved source.
- Added unit coverage proving legacy `serviceSummary` and `service_summary` values are ignored and do not leak when `approved_service_summary` is absent.
- Added positive coverage proving approved summaries are trimmed before customer display.
- Added malformed/unsafe source coverage proving raw unsafe approved summary candidates do not appear in response JSON.
- Added static coverage guarding against restoring the old fallback chain.

## Scope Guard

- No DB schema or migration changes.
- No route mount, server, or app mount changes.
- No Zeabur, env, or smoke checks.
- No provider sending, LINE, SMS, email, or webhook changes.
- No admin frontend, AI/RAG, billing, or settlement changes.
- The held historical untracked docs remain untouched.
