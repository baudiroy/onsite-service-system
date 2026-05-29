# Task2056 Customer-facing Service Report PM Next-step Decision Packet / No Runtime Change

## Current baseline

- Baseline commit before this task: `4063bb47e22473912223055d64a9d973b1313efe`
- Branch: `main`
- Upstream: `origin/main`
- Scope: PM-facing decision report for the next customer-facing service report step.

## PM report

Task2046 through Task2055 hardened the customer-facing service report runtime path without DB, smoke, provider, billing, AI, storage, or deployment execution.

Completed hardening:

- Task2046: attachment visibility contract.
- Task2047: row publication contract.
- Task2048: attachment metadata value contract.
- Task2049: attachment label value contract.
- Task2050: completion time value contract.
- Task2051: service status display value contract.
- Task2052: engineer display-name value contract.
- Task2053: appointment window value contract.
- Task2054: case reference value contract.
- Task2055: customer report reference identifier contract.

Current synchronized head:

- `HEAD = origin/main = 4063bb47e22473912223055d64a9d973b1313efe`

## Remaining product decision

The only remaining customer-facing service report DTO text field in this projection family is `serviceSummary`.

`serviceSummary` is different from the fields hardened in Task2050 through Task2055:

- It is customer-facing free text, not a compact identifier, status, timestamp, appointment window, or display name.
- It may legitimately contain broad natural-language content.
- Filtering it with generic keywords such as `token`, `secret`, `password`, `select`, `from cases`, or `postgres://` could prevent accidental leak-through, but it could also suppress legitimate customer-visible service notes if PM intends free-form summaries.
- The current implementation still maps `serviceSummary`, `service_summary`, or `approved_service_summary` as a customer-facing summary field.

## PM decision options

### Option A - keep `serviceSummary` as free text for now

Recommended if the product expectation is that this field already comes from a trusted customer-approved summary source.

Follow-up engineering task:

- add a no-runtime PM acceptance note that service summary filtering is intentionally deferred;
- keep existing runtime behavior unchanged;
- revisit only when PM defines exact redaction rules or a dedicated approved-summary source.

### Option B - restrict `serviceSummary` source to `approved_service_summary`

Recommended if PM wants customer-visible summaries to come only from an explicit approved column.

Follow-up engineering task:

- update projection source precedence to emit `approved_service_summary` only;
- omit legacy/free-form `serviceSummary` and `service_summary` aliases;
- add direct projection and full-route synthetic coverage;
- keep no-DB/no-smoke scope.

Product impact:

- safer approval semantics;
- possible omission of summaries in rows that only populate legacy/free-form fields.

### Option C - add a conservative malformed-summary deny filter

Recommended only if PM accepts that certain summary text will be omitted when it contains internal-looking sentinel markers.

Follow-up engineering task:

- add a summary-specific filter, not the compact display-value filter;
- reject URL/path/DB URL/SQL/internal sentinel markers;
- add tests for malformed summary omission and ordinary prose preservation;
- keep no-DB/no-smoke scope.

Product impact:

- stronger leak prevention;
- higher chance of suppressing a legitimate free-text customer note.

## Recommendation to PM

Choose Option B if the data model can guarantee `approved_service_summary` is the intended customer-facing source. It gives a clear product approval boundary without generic keyword filtering.

Choose Option A if that approval source is not yet guaranteed. In that case, do not auto-filter `serviceSummary` in runtime yet.

Avoid Option C until PM provides explicit redaction language, because generic keyword filtering on free text can create surprising customer-visible omissions.

## Proposed next runtime task after PM decision

If PM selects Option B:

- Task2057 should be `customer-facing-service-report-approved-summary-source-contract-no-db-no-smoke`.
- Allowed files:
  - `src/customerAccess/customerServiceReportProjectionService.js`
  - `tests/customerAccess/customerServiceReportProjectionService.unit.test.js`
  - `tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js`
  - new Task2057 doc
- Verification:
  - focused customer access service report projection and full-route tests;
  - full `tests/customerAccess` sweep;
  - `npm run check`;
  - `git diff --check`.

If PM selects Option A:

- Task2057 should move to a different customer-facing service report hardening item instead of modifying `serviceSummary`.

## Explicit non-actions

- No runtime source change.
- No test change.
- No DB connection.
- No SQL, migration, seed, or smoke execution.
- No endpoint probe or public/shared/prod target access.
- No Zeabur observation, deploy, restart, rollback, or env inspection.
- No provider, billing, AI, storage provider, or RAG execution.
- No file upload, file download, or signed URL generation.
- No Completion Report or Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No route expansion or global app/server mount change.

## Verification

- `git diff --check`
  - Result: PASS.

## Safety notes

- This task is docs-only and no-runtime-change.
- It records the PM decision boundary before any service summary runtime behavior changes.
