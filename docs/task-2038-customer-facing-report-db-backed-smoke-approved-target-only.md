# Task2038 Customer-facing Report DB-backed Smoke / Approved Target Only

## Exact PM Approval

I approve running Task2038 Customer-facing Report DB-backed smoke against the explicitly named non-secret target: approved_test_customer_report_smoke_task2038. Use disposable approved local/test PostgreSQL only. Apply migrations 001-026 and run safe local/test seed only as needed for the smoke target. Do not use Zeabur DB, shared DB, staging DB, or production DB. Do not print DATABASE_URL, DB credentials, passwords, password hashes, auth tokens, or secrets. Do not deploy. Do not modify Zeabur env values. Do not trigger provider sending, billing provider, AI, Completion Report / FSR creation or publish, finalAppointmentId mutation, or customer-visible publication.

## Approved Target

- Target name: `approved_test_customer_report_smoke_task2038`
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
- Created synthetic local/test rows and temp customer-access read-model tables in the disposable target for this smoke only.
- The synthetic fixture included publication/read-model rows only to exercise the customer-facing access gate. It did not publish real customer-visible data and did not create or mutate formal Completion Report / Field Service Report behavior.

## Smoke Action

- Smoke command/script name: `task2038_customer_access_full_route_db_backed_local_test`
- Harness location during execution: temporary local file under `/private/tmp`, not committed.
- App path exercised in memory:
  - `GET /customer-access/:caseId/service-report/:reportId`
- Direct handler path exercised in memory:
  - `handleCustomerServiceReportProjectionRequest`
- DB client target: injected local/test PostgreSQL client only.
- Runtime server listener: not started.
- Public/Zeabur endpoint: not probed.

## Smoke Result

- Overall result: fail, safe.
- Full route status: `404`
- Full route envelope status: `deny`
- Full route message key: `customerAccess.unavailable`
- Full route customerVisible: `false`
- Direct projection status: `404`
- Direct projection envelope status: `deny`
- Direct projection message key: `customerAccess.unavailable`
- Direct projection customerVisible: `false`
- Runtime DB query count: `21`
- Runtime SELECT count: `21`
- Runtime non-SELECT statements observed: none.
- Runtime named statement categories observed:
  - `customerAccessContextReadModel`
  - `customerServiceReportProjection`

The customer-facing report DB-backed allow path did not return the expected filtered allow DTO against the disposable local/test fixture. The observed failure remained a generic safe-deny response and did not expose internal data.

## Data Exposure Check

- Forbidden marker leak: false.
- Raw DB rows exposed: no.
- DB credentials exposed: no.
- Passwords or password hashes exposed: no.
- Auth tokens exposed: no.
- SQL text exposed in API response: no.
- Stack traces exposed in API response: no.
- Raw phone/address exposed: no.
- Provider payload exposed: no.
- Billing/internal settlement data exposed: no.
- `finalAppointmentId` exposed: no.
- Internal FSR/report identifiers exposed: no.

## Mutation Check

- Runtime write SQL observed during smoke path: false.
- `field_service_reports` row count changed: false.
- `appointments` row count changed: false.
- Completion Report / FSR creation: no.
- Completion Report / FSR publish: no.
- Completion Report / FSR approval/revoke/mutation: no.
- `finalAppointmentId` mutation: no.
- Customer-visible publication behavior: no runtime behavior created or mutated.
- Provider sending: no.
- Billing provider: no.
- AI/RAG provider: no.

## Cleanup Result

- Disposable PostgreSQL target cleaned up: yes.
- Temporary smoke harness committed: no.
- Generated DB dumps/logs committed: no.
- Repo runtime/source files changed: no.
- Admin frontend changed: no.
- Package/lockfile changed: no.

## Failure Classification

This is a safe DB-backed smoke failure, not a data exposure failure.

The route and direct projection both stayed on the generic safe-deny path after DB-backed reads. The next task should investigate the customer-facing report DB-backed allow-path contract with a bounded source/test task before proceeding to broader customer-facing report smoke.

## Recommendation

Choose option B from the Task2038 completion gate:

- B. investigate DB-backed smoke failure.

Do not proceed to Task2039 until PM accepts this Task2038 result and explicitly assigns the next target or bounded investigation task.

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
- No customer-visible publication behavior was created or mutated.
- The 7 held historical docs were not touched.
