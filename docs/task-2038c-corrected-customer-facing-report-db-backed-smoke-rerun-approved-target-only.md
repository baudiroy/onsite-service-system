# Task2038C Corrected Customer-facing Report DB-backed Smoke Rerun / Approved Target Only

## Exact PM Approval

I approve running Task2038C corrected Customer-facing Report DB-backed smoke rerun against the explicitly named non-secret target: approved_test_customer_report_smoke_rerun_task2038c. Use disposable approved local/test PostgreSQL only. Apply migrations 001-026 and run only safe synthetic/local test fixture setup needed for this smoke. Do not use Zeabur DB, shared DB, staging DB, or production DB. Do not print DATABASE_URL, DB credentials, passwords, password hashes, auth tokens, or secrets. Do not deploy. Do not modify Zeabur env values. Do not trigger provider sending, billing provider, AI, Completion Report / FSR creation or publish, finalAppointmentId mutation, or customer-visible publication.

## Approved Target

- Target name: `approved_test_customer_report_smoke_rerun_task2038c`
- Target type: disposable approved local/test PostgreSQL only.
- Zeabur/shared/staging/production DB: not used.
- Public endpoint probe: not run.
- Runtime server listener: not started.

## Setup Actions

- Created a clean disposable local/test PostgreSQL container for this task.
- Applied migrations `001` through `026` inside the disposable target.
- First migration: `001_create_base_tables.sql`
- Last migration: `026_create_repair_intake_persistence_tables.sql`
- Safe local/test seed command: not run.
- `npm run db:migrate`: not run.
- `npm run db:seed`: not run.
- Created synthetic local/test fixture rows and customer-access read-model tables inside the disposable target only.
- The synthetic fixture included only the rows needed to exercise customer-facing report access and projection gates.
- Formal Completion Report / Field Service Report fixture creation: no.
- Customer-visible publication behavior creation: no runtime behavior was created or mutated.

## Smoke Action

- Smoke command/script name: `task2038c_customer_access_full_route_db_backed_local_test`
- Harness location during execution: temporary local file under `/private/tmp`, not committed.
- Full route exercised in memory:
  - `GET /customer-access/:caseId/service-report/:reportId`
- Direct handler exercised in memory:
  - `handleCustomerServiceReportProjectionRequest`
- DB client target: injected disposable local/test PostgreSQL client only.
- Runtime server listener: not started.
- Public/Zeabur endpoint: not probed.

## Smoke Result

- Overall result: fail, safe.
- Unsafe failure: false.
- Full route allow-path passed: no.
- Direct handler allow-path passed: yes.

### Full Route Result

- HTTP status: `404`
- Envelope status: `deny`
- Message key: `customerAccess.unavailable`
- `customerVisible`: `false`
- Customer-visible service report keys returned: none.

### Direct Handler Result

- HTTP status: `200`
- Envelope status: `allow`
- Message key: `customerAccess.serviceReport.available`
- `customerVisible`: `true`
- Customer-visible service report keys returned:
  - `appointmentWindow`
  - `caseReference`
  - `completionTime`
  - `customerReportReference`
  - `engineerDisplayName`
  - `publicAttachments`
  - `serviceStatus`
  - `serviceSummary`

## Query / Mutation Safety

- Runtime DB query count: `21`
- Runtime SELECT count: `21`
- Runtime non-SELECT count: `0`
- Forbidden write SQL observed during smoke path: no.
- Runtime query categories observed:
  - `customerAccessContextReadModel:case`
  - `customerAccessContextReadModel:identity`
  - `customerAccessContextReadModel:publication`
  - `customerVisibleServiceReports`

### Row Count Changes During Smoke

| Table/check | Before smoke | After smoke | Changed |
| --- | ---: | ---: | --- |
| `appointments` | 0 | 0 | no |
| `field_service_reports` | 0 | 0 | no |
| `customer_access_publications` | 1 | 1 | no |
| `customer_visible_service_reports` | 1 | 1 | no |

## Data Exposure Check

- Forbidden marker leak: false.
- Leaked marker count: `0`
- Raw DB rows exposed: no.
- DB credentials exposed: no.
- `DATABASE_URL` printed: no.
- Passwords or password hashes exposed: no.
- Auth tokens exposed: no.
- SQL text exposed in API response: no.
- Stack traces exposed in API response: no.
- Raw phone/address exposed: no.
- Provider payload exposed: no.
- Billing/internal settlement data exposed: no.
- `finalAppointmentId` exposed: no.
- Internal FSR/report identifiers exposed: no.
- Direct handler customer-visible DTO was filtered to allow-listed fields only.

## Cleanup Result

- Disposable PostgreSQL target cleaned up: yes.
- Temporary smoke harness removed: yes.
- Temporary smoke harness committed: no.
- Generated DB dumps/logs committed: no.
- Repo runtime/source files changed: no.
- Admin frontend changed: no.
- Package/lockfile changed: no.

## Failure Classification

This is a safe corrected DB-backed smoke failure.

Task2038B fixed the direct projection contract: the direct handler now returns a sanitized `allow` DTO from the disposable DB-backed fixture. The full mounted report route still returns generic safe-deny, which indicates a remaining route/controller access-gate or context-to-controller contract issue before the projection response is surfaced through the full route.

The failure stayed safe:

- no HTTP `500`
- no secrets
- no raw DB rows
- no raw SQL in response
- no raw phone/address
- no FSR internals
- no `finalAppointmentId`
- no provider/billing/AI data
- no mutation of FSR, appointment, publication, or customer-visible behavior

## Recommendation

Choose option B from the Task2038C completion gate:

- B. create bounded Task2038D investigation/fix.

Do not proceed to Task2039 until PM accepts this Task2038C result and explicitly assigns the next target or bounded investigation task.

## Safety Confirmation

- No Zeabur DB was used.
- No shared/staging/production DB was used.
- No public endpoint was probed.
- No deploy, redeploy, restart, or rollback was performed.
- No Zeabur env values were inspected or modified.
- No DB URL, DB credentials, passwords, password hashes, auth tokens, private keys, provider keys, Zeabur secrets, or other secrets were printed.
- No provider sending, billing provider, invoice, payment, payment method, or AI/RAG provider call was performed.
- No Completion Report / FSR behavior was created, published, approved, revoked, or mutated.
- No `finalAppointmentId` mutation was performed.
- No customer-visible publication behavior was created or mutated during the smoke path.
- The 7 held historical docs were not touched.
