# Task1836 Engineer Mobile Visit Action DB Schema Readiness Contract / No Migration No SQL

## Status

Task1836 is a documentation and static-test readiness contract only. It records candidate future DB persistence boundaries for Engineer Mobile visit actions after the accepted runtime envelope chain.

It does not approve or perform any DB work.

## Purpose

Translate the accepted Engineer Mobile visit action runtime fields, status values, result values, and audit envelopes into a future migration readiness contract before any DDL, migration, DB dry-run, repository implementation, or route integration is requested.

The intended chain is:

runtime fields/statuses/results/audit envelopes -> DB schema readiness contract doc -> static guard -> no SQL file -> no migration -> no DB execution

## Current runtime contract source

The current accepted runtime source of truth is the pure, injected Engineer Mobile visit action chain:

- `engineerMobileVisitActionTransitionPatchBuilder`
- `engineerMobileVisitActionAuditEventBuilder`
- `engineerMobileVisitActionPersistencePortContract`
- `engineerMobileVisitActionPersistencePortWriterAdapter`
- `engineerMobileVisitActionIntegratedPersistenceWriter`
- `engineerMobileVisitActionRuntimeBootstrap`

These modules define the safe transition patch envelope, audit event envelope, accepted visit statuses, accepted visit results, accepted audit actions, injected persistence-port boundary, and runtime bootstrap wiring. Task1836 does not modify them.

## Future DB persistence target

Future DB persistence should persist visit-action transition state at the appointment / dispatch visit layer and audit evidence as an internal event record. It must preserve the project rule that a Case may have multiple appointments / dispatch visits while a Case ultimately has only one formal Field Service Report.

The future persistence target should remain organization-scoped, permission-aware, assignment-aware, auditable, and safe for customer-visible filtering. Any future repository or migration must use the accepted runtime envelopes as input contracts rather than accepting raw request, provider, customer, report draft, or DB error payloads.

## Candidate appointment fields

Candidate appointment / visit-layer mapping, not approved DDL:

| Candidate field | Runtime source | Notes |
| --- | --- | --- |
| `appointment_id` | transition `appointmentId` / envelope `entityId` | Existing appointment identity or mapped row identity. |
| `organization_id` | transition `organizationId` | Required tenant isolation scope. |
| `case_id` | transition `caseId` / audit context `caseId` | Case relationship only; not a formal-report uniqueness key here. |
| `mobile_visit_status` | transition `mobileVisitStatus` | Candidate appointment visit-state field. |
| `visit_result` | transition `visitResult` | Present when status is `visit_result_recorded`. |
| `mobile_visit_status_updated_at` | transition patch `updatedAt` | Deterministic timestamp supplied through accepted runtime input. |
| `mobile_visit_status_updated_by` | transition patch `updatedBy` / actor id | Engineer or authorized actor identity. |
| `last_engineer_mobile_action` | transition `action` | Candidate trace of the accepted mobile action family. |
| `last_engineer_mobile_request_id` | audit context `requestId` | Optional idempotency / correlation candidate for later design. |

This is a candidate mapping, not approved DDL. Task1836 creates no table, column, index, repository, route, service, migration, or DB runtime.

## Candidate audit event fields

Candidate internal audit event mapping, not approved DDL:

| Candidate field | Runtime source | Notes |
| --- | --- | --- |
| `organization_id` | audit `organizationId` | Required tenant isolation scope. |
| `entity_type` | audit `entityType` | Currently expected to be `appointment`. |
| `entity_id` | audit `entityId` | Appointment / visit entity id. |
| `actor_id` | audit `actorId` | Actor who performed the accepted action. |
| `action` | audit `action` | Accepted Engineer Mobile audit action string. |
| `occurred_at` | audit `occurredAt` | Deterministic timestamp supplied through accepted runtime input. |
| `case_id` | audit `caseId` | Case relationship for internal trace only. |
| `appointment_id` | audit `appointmentId` | Appointment relationship for internal trace only. |
| `request_id` | audit `requestId` | Optional correlation / idempotency key candidate. |
| `metadata` | future minimized metadata | Must stay allow-listed and non-sensitive. |

`metadata` must not contain raw customer contact data, provider payloads, report draft data, SQL, DB errors, customer-visible publication fields, full phone, full address, LINE ids, tokens, secrets, internal notes, AI raw payloads, or settlement/billing internals.

## Supported runtime values

Accepted `mobile_visit_status` values:

- `traveling`
- `arrived`
- `working`
- `work_finished`
- `visit_result_recorded`

Accepted `visit_result` values:

- `resolved`
- `follow_up_required`
- `parts_required`
- `cannot_repair`
- `customer_unavailable`
- `cancelled_on_site`

Accepted audit actions:

- `engineer_mobile.start_travel.allowed`
- `engineer_mobile.arrive.allowed`
- `engineer_mobile.start_work.allowed`
- `engineer_mobile.finish_work.allowed`
- `engineer_mobile.record_visit_result.allowed`

## Required indexes / uniqueness considerations

Future DB design should consider organization-scoped access and visit-action lookup without changing uniqueness rules in Task1836.

- Appointment visit-action persistence should be scoped by `organization_id` and `appointment_id`.
- Case relationship lookup may need `organization_id` with `case_id`, but appointment history must still allow multiple appointments / dispatch visits per Case.
- Do not add any uniqueness rule that would limit one Case to one appointment / dispatch visit.
- Preserve the existing one Case / one formal Field Service Report invariant.
- Do not weaken or replace `field_service_reports.case_id` uniqueness.
- Audit-event lookup should be scoped by `organization_id`, `entity_type`, `entity_id`, `action`, `occurred_at`, and optional `request_id` only after separate approval.
- Idempotency or request correlation for `last_engineer_mobile_request_id` remains a future candidate, not approved runtime behavior.

## Organization isolation requirements

Future persistence must require `organization_id` on appointment transition state and audit event records. No transition or audit event may cross organization scope. Future repository, route, smoke, or DB dry-run tasks must prove tenant isolation before runtime adoption.

## Permission and assignment requirements

Future DB-backed persistence must require an authorized actor and appointment assignment / eligibility check before any write path. Engineer access must remain limited to assigned or explicitly authorized appointments. Dispatcher, supervisor, admin, or override behavior must be separately permissioned and audited.

Task1836 does not implement permission services, assignment resolvers, repositories, routes, controllers, or audit persistence.

## Customer-visible data restrictions

Future appointment state and audit persistence are internal operational records. Customer-visible outputs must not expose internal audit records, raw actor metadata, permission reasons, raw DB errors, internal notes, provider payloads, AI raw payloads, settlement/billing internals, full phone, full address, LINE ids, tokens, secrets, or report draft internals.

Any customer-visible projection must use a separately approved projection and filtering task.

## Completion Report / Field Service Report boundary

Engineer Mobile visit action persistence belongs to the appointment / dispatch visit layer. It must not create, approve, publish, duplicate, or imply a formal Completion Report or Field Service Report.

The project invariant remains unchanged:

- One Case may have multiple appointments / dispatch visits.
- One Case ultimately has only one formal Field Service Report.
- `field_service_reports.case_id` uniqueness must remain protected.
- Visit results are source data and operational state, not a second formal FSR.

## finalAppointmentId boundary

`finalAppointmentId` remains backend/system-owned and must be derived from the final completed appointment. Engineer Mobile visit actions must not expose, set, infer, override, or mutate `finalAppointmentId`.

Manual `finalAppointmentId` selection remains an admin exception / override only and is not part of Task1836 or this persistence readiness contract.

## Migration authorization gates

Any future DB work requires a new bounded task with explicit authorization before each step:

- exact migration file scope
- exact static migration boundary test scope
- disposable local/test DB target approval
- DB dry-run command approval
- repository contract approval
- injected synthetic DB client test approval
- runtime bootstrap repository-port wiring approval
- route/global mount approval
- smoke approval

Task1836 grants none of those approvals.

## Forbidden in Task1836

- No migration created in Task1836
- No SQL file created in Task1836
- No DB execution in Task1836
- No psql in Task1836
- No npm run db:migrate in Task1836
- No schema/index change in Task1836
- No repository implementation in Task1836
- No runtime persistence implementation in Task1836
- No provider sending in Task1836
- No route/global mount in Task1836
- No Completion Report / Field Service Report creation in Task1836
- No finalAppointmentId mutation in Task1836
- No customer-visible publication in Task1836
- No source/runtime changes in Task1836
- No admin UI in Task1836
- No package or lockfile changes in Task1836
- No seed changes in Task1836
- No smoke test in Task1836
- No cleanup/reset/stash/revert in Task1836
- No staging / commit / push in Task1836

## Future bounded implementation sequence

1. Migration draft file only, no apply.
2. Static migration boundary test.
3. Disposable DB dry-run authorization packet.
4. Disposable DB dry-run only after explicit approval.
5. Repository contract around persistence port.
6. Injected repository adapter tests with synthetic DB client.
7. Runtime bootstrap wiring with injected repository port.
8. Global route/mount only after separate explicit approval.

Each step must repeat the no customer-visible publication, no Completion Report / Field Service Report creation, no `finalAppointmentId` mutation, organization isolation, permission, audit, and sensitive-data boundaries.

## Verification

Task1836 verification should run:

- `node --test tests/engineerMobile/engineerMobileVisitActionDbSchemaReadinessContract.static.test.js`
- a precise credential/sensitive scan limited to the two touched Task1836 files
- `git diff --check -- docs/task-1836-engineer-mobile-visit-action-db-schema-readiness-contract-no-migration-no-sql.md tests/engineerMobile/engineerMobileVisitActionDbSchemaReadinessContract.static.test.js`

Expected result: documentation/static readiness only, no src/runtime changes, no migration file, no SQL file, no DB execution, no repository implementation, no route/global mount, no provider sending, no Completion Report / Field Service Report creation, no `finalAppointmentId` mutation, and no customer-visible publication.
