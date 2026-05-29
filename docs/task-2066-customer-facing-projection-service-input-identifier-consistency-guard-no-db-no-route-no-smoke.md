# Task2066 — Customer-Facing Projection Service Input Identifier Consistency Guard / No DB No Route No Smoke

## Scope

- Added an explicit projection service input identifier guard for only these top-level keys:
  - `caseId`
  - `reportId`
- The top-level identifiers must be safe nonempty strings and are read only from those exact keys.
- Alias and wrapper fields such as `public_report_id`, `publicReportId`, `report_id`, `case_id`, `row`, `rows`, `data`, `payload`, `result`, `raw`, `rawRow`, `dbRow`, `customerAccessContext.reportId`, and `customerAccessContext.public_report_id` are not accepted as service input identifiers.
- The top-level `caseId` must exactly match `customerAccessContext.caseId` after service input normalization.

## Safe-Deny Behavior

- Missing, malformed, unsafe, alias-only, wrapper-only, or inconsistent service input identifiers fail closed before query.
- Failed validation returns the existing sanitized unavailable envelope:
  - `status: deny`
  - `messageKey: customerAccess.unavailable`
  - `customerVisible: false`
  - `data: null`
  - `error.messageKey: customerAccess.unavailable`
- The response does not expose mismatch details, expected values, actual values, organizationId, customerId, raw context, or raw identifiers.

## Regression Coverage

- Task2058 `serviceSummary` still comes only from `approved_service_summary`.
- Task2061 `completionTime` still comes only from `completion_time`.
- Task2060 `publicAttachments` public item keys remain allowlisted.
- Task2059 `serviceReport` top-level keys remain allowlisted.
- Task2062 malformed projection rows still fail closed.
- Task2065 malformed or unauthorized `customerAccessContext` still fails closed before query.

## Boundaries

- No DB changes.
- No migrations, SQL, seeds, schema, indexes, psql, db, migration dry-run, or migration apply.
- No repository query changes.
- No route/controller/global mount changes.
- No HTTP handler or app adapter changes.
- No Zeabur/env/runtime smoke.
- No provider sending.
- No admin frontend.
- No AI/RAG/provider/model calls.
- No billing/settlement/payment/invoice work.
- No package or package-lock changes.
- The 7 held historical untracked docs were not touched.
