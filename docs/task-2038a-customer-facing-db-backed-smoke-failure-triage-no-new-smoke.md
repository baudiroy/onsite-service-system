# Task2038A Customer-facing DB-backed Smoke Failure Triage / No New Smoke

## Baseline

- Baseline commit: `d23b0491c30c72f39212cd6c9399f056ecd7fe2e`
- Task2038 status: accepted as safe failed smoke.
- Task2038 target: `approved_test_customer_report_smoke_task2038`
- Target type used in Task2038: disposable local/test PostgreSQL only.
- This Task2038A scope: static triage only.

## Task2038 Failure Summary

- Full route `GET /customer-access/:caseId/service-report/:reportId` returned HTTP `404`.
- Full route envelope stayed on `customerAccess.unavailable`.
- Full route `customerVisible` was `false`.
- Direct `handleCustomerServiceReportProjectionRequest` returned HTTP `404`.
- Direct projection envelope stayed on `customerAccess.unavailable`.
- Direct projection `customerVisible` was `false`.
- Runtime query behavior was SELECT-only:
  - runtime query count: `21`
  - runtime SELECT count: `21`
  - runtime non-SELECT statements observed: none
  - named statements observed: `customerAccessContextReadModel`, `customerServiceReportProjection`
- No secrets, raw DB rows, raw phone/address, provider payload, billing/internal data, SQL text, stack traces, or `finalAppointmentId` leaked.
- No Completion Report / FSR mutation occurred.
- No customer-visible publication mutation occurred.
- Failure classification from Task2038 remains: fail, safe.

## Candidate Causes Checklist

| Candidate cause | Static triage result | Evidence |
| --- | --- | --- |
| Missing or mismatched customer access context row | Possible, but not the strongest explanation by itself. | The route requires repository-backed context methods to all return allow-state pieces before the report handler runs. |
| Missing or mismatched case/customer/reporter identity relationship | Possible in a real fixture, but Task2038 supplied matching synthetic case/customer ids. | `customerAccessContextProvider` requires verified customer identity and case linkage before allow. |
| Missing publication state / unpublished report | Possible in a real fixture; Task2038 supplied a synthetic publication row. | `customerAccessContextProvider` requires `publication.allowed` or `publicationAllowed`. |
| Missing Field Service Report / Completion Report projection row | Possible in real schema because the code reads `customer_visible_service_reports`, but migrations do not define that relation. | Static migration scan shows no active migration creating `customer_visible_service_reports`. |
| `reportId` mismatch | Possible, but not primary based on Task2038 evidence. | The direct projection query filters by `public_report_id = $4`, then later checks returned row identity again. |
| `caseId` mismatch | Possible, but not primary based on Task2038 evidence. | Projection service compares request case id, context case id, and returned row case id. |
| `organizationId` mismatch | Possible, but not primary based on Task2038 evidence. | Projection service requires returned row `organization_id` to match context organization id. |
| Customer access resolver denied | Likely for the full route. | The full route safe-denies before projection if `buildCustomerAccessControllerResponse(req)` is not `allow`. |
| Projection query join predicate mismatch | Likely. | The projection SQL filters by organization/customer/case/report, but does not select those scoped columns back for the post-query row checks. |
| Route handler expected synthetic DTO shape mismatch | Possible secondary issue. | Existing tests use synthetic rows that include more fields than the SQL select list returns from PostgreSQL. |
| Fixture inserted into wrong table or missing required field | Less likely as the only cause. | Task2038 created temp versions of expected relation names, but direct projection still safe-denied. |
| Migration/schema mismatch | Likely as a future real-target blocker. | Migrations `001`-`026` do not create `customer_channel_identities`, `customer_access_publications`, or `customer_visible_service_reports`. |
| Expected app-level safe-deny when publication is not explicitly allowed | Confirmed behavior. | Task1883A documents HTTP 404 stealth safe-deny for denied, unavailable, unpublished, missing context, and not-found states. |

## Static Evidence

### Full Route Safe-deny Gate

`src/routes/customerAccessRoutes.js` registers:

- `/customer-access/:caseId`
- `/customer-access/:caseId/service-report/:reportId`

The report route builds an access envelope before projection. If the envelope is not `allow`, it returns the generic safe-deny body with HTTP `404`. This makes the full route sensitive to customer access context construction before the projection handler can return data.

### Customer Access Context Predicates

`src/customerAccess/customerAccessContextProvider.js` requires all of these for the repository-backed allow path:

- repository contract methods exist
- organization scope matched
- verified customer identity
- case linked to customer
- publication allowed
- customer visible policy passed, or projection available under an allowed publication

If any required piece is missing, the provider returns the empty context and the route correctly safe-denies.

### DB Query Executor Contract Risk

`src/customerAccess/customerAccessDbQueryExecutor.js` calls `dbClient.query(...)`, then immediately passes the return value to `firstResultRow(...)`.

Static implication:

- Existing synthetic tests use synchronous injected query clients that return `{ rows: [...] }` directly.
- A normal PostgreSQL client returns a Promise from `query(...)`.
- The current executor does not await that Promise.
- A Promise is not an array and does not have a `rows` array, so `firstResultRow(...)` returns `undefined`.
- That produces an empty read-model bundle and can cause the full route to safe-deny before projection.

This explains why Task2038 full-route DB-backed execution can remain on `customerAccess.unavailable` even when the disposable target has matching fixture rows.

### Projection Query Mismatch Risk

`src/customerAccess/customerServiceReportProjectionService.js` builds a `customerServiceReportProjection` query that selects:

- `public_report_id`
- `case_display_id`
- `service_status_display`
- `appointment_window`
- `engineer_display_name`
- `service_summary`
- `completion_time`

The same service later filters the returned row by:

- `organization_id`
- `customer_id`
- `case_id`
- `public_report_id`
- publication/customer-visible state

Static implication:

- The SQL where clause filters by organization/customer/case/report.
- The SQL select list does not return `organization_id`, `customer_id`, `case_id`, or publication state fields.
- A real PostgreSQL row returned from this query cannot satisfy the later post-query row identity checks, even if the table contains those columns.
- Existing direct projection unit tests use synthetic rows that include the scoped fields regardless of the SQL select list, so they do not catch this DB-backed mismatch.

This explains why Task2038 direct projection handler can return `customerAccess.unavailable` against a real PostgreSQL-backed fixture.

### Migration / Schema Readiness Risk

The customer access DB read path references these relation names:

- `customer_channel_identities`
- `customer_access_publications`
- `customer_visible_service_reports`

Static migration inspection found references in comments and tests, but no active migration `001`-`026` creating those relations. Task2038 created temp local/test versions only for the disposable smoke target. A future persistent DB-backed allow path needs an explicit schema/read-model decision before it can be treated as deploy-ready.

## Likely Failure Cause Classification

**Runtime bug likely.**

The strongest static evidence points to two runtime contract mismatches rather than a simple missing fixture:

1. The full route repository/query-executor path appears synchronous, while real PostgreSQL clients are Promise-based.
2. The direct projection query omits columns that the post-query allow filter requires.

The fixture may still need cleanup or formalization, but correcting fixture rows alone is unlikely to make the current real PostgreSQL-backed allow path pass.

## Required Rows / Predicates For Future Allow Path

A future allow-path test or fix should prove these pieces explicitly:

- input includes `organizationId`, `caseId`, and `customerId`
- case row matches organization, case, and customer
- customer identity row matches organization and customer, with verified identity
- case linkage resolves to the same case/customer
- publication row allows customer-visible access and passes customer-visible policy
- service report projection row exists for the same organization, customer, case, and report id
- report projection row includes only customer-facing allow-list fields in the response
- raw phone/address/internal notes/provider payload/billing internals/SQL/stack/secrets/final appointment internals remain excluded

## Recommended Follow-up Task

Recommended next task:

**Task2038B synthetic fixture alignment test / no DB**

Reason:

- It can reproduce the failure contract without connecting to a DB.
- It can add focused tests for Promise-returning DB clients and projection query selected-field requirements.
- It can separate source/test contract hardening from any future DB-backed rerun.
- It avoids jumping directly into another disposable DB smoke before the allow-path contract is understood.

Do not proceed to Task2039 until Task2038B or an equivalent PM-approved bounded investigation resolves this allow-path mismatch.

## Explicit Non-actions

- No new smoke was run.
- No DB container was created.
- No DB connection was opened.
- No SQL was run.
- No migration command was run.
- No seed command was run.
- No endpoint was probed.
- `/healthz` was not called.
- No Zeabur env values were inspected.
- No deploy, redeploy, restart, or rollback was performed.
- No runtime/source files were modified.
- No package, lockfile, or admin frontend files were modified.
- No secrets were inspected or printed.
- No provider, billing, or AI execution was performed.
- No Completion Report / FSR behavior was created or mutated.
- No `finalAppointmentId` mutation was performed.
- No customer-visible publication behavior was created or mutated.
- The 7 held historical docs were not touched.
