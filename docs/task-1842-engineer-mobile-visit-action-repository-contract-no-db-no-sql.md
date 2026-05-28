# Task1842 Engineer Mobile Visit Action Repository Contract / No DB No SQL

Status: implemented as a pure contract module with unit and static boundary tests.

## Purpose

Task1842 adds the future Engineer Mobile visit action repository contract. The contract validates sanitized repository input envelopes and normalizes sanitized future repository result envelopes before any real repository implementation exists.

This is a runtime-adjacent contract only. It does not persist, query, write, mount, send, or publish anything.

## Allowed Files

- `src/engineerMobile/engineerMobileVisitActionRepositoryContract.js`
- `tests/engineerMobile/engineerMobileVisitActionRepositoryContract.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionRepositoryContractBoundary.static.test.js`
- `docs/task-1842-engineer-mobile-visit-action-repository-contract-no-db-no-sql.md`

The 7 held historical untracked docs remain untouched.

## Relationship To Task1828

Task1828 defined the Engineer Mobile visit action persistence port contract shape. Task1842 follows that safe envelope direction but deliberately does not import Task1828 or any other module.

The new repository contract is narrower and later-facing:

- It accepts only sanitized transition patch and optional audit event envelopes.
- It rejects unsafe fields in the repository input root, transition root, patch, audit context, audit root, and audit event.
- It normalizes future repository result shapes into safe success or failure envelopes.
- It does not expose raw DB details, SQL details, errors, provider payloads, customer data, completion report draft fields, publication fields, or stack traces.

## No-Import / No-DB / No-SQL Boundary

The contract module has no imports.

Forbidden scope remains:

- No DB
- No SQL
- No migration
- No DB / SQL execution / psql
- No SQL statement builder
- No repository implementation
- No repository imports
- No controller changes
- No global route registration
- No src/app.js, src/server.js, or routes/index.js changes
- No Express import
- No listen call
- No smoke test
- No real persistence/write execution
- No audit log persistence
- No provider sending
- No AI / RAG
- No billing / settlement
- No admin UI
- No package.json or lockfile changes
- No seed changes
- No permission table migration
- No completion report creation
- No completion report approval
- No completion report publication
- No Field Service Report creation
- No Field Service Report approval
- No Field Service Report publication
- No finalAppointmentId creation or mutation
- No customer-visible publication
- No staging / commit / push
- No cleanup/reset/stash/revert
- No touching the 7 held historical docs

## Accepted Input Envelope Shapes

The public contract exports:

- `ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND`
- `validateEngineerMobileVisitActionRepositoryInput`
- `validateEngineerMobileVisitActionRepositoryResult`
- `normalizeEngineerMobileVisitActionRepositoryResult`

`validateEngineerMobileVisitActionRepositoryInput({ transitionPatchEnvelope, auditEventEnvelope })` accepts a required `transitionPatchEnvelope` and an optional `auditEventEnvelope`.

The transition patch envelope allows only:

- `patchKind`
- `entityType`
- `entityId`
- `organizationId`
- `action`
- `patch`
- `auditContext`

The `patch` object allows only:

- `mobileVisitStatus`
- `visitResult`
- `updatedBy`
- `updatedAt`

The optional `auditContext` allows only:

- `actorId`
- `caseId`
- `appointmentId`
- `requestId`

The audit event envelope allows only:

- `eventKind`
- `action`
- `entityType`
- `entityId`
- `actorId`
- `organizationId`
- `occurredAt`
- `auditEvent`

The `auditEvent` object allows only:

- `action`
- `entityType`
- `entityId`
- `actorId`
- `organizationId`
- `occurredAt`
- `caseId`
- `appointmentId`
- `requestId`

Supported `entityType` is `appointment`.

Supported `mobileVisitStatus` values are:

- `traveling`
- `arrived`
- `working`
- `work_finished`
- `visit_result_recorded`

Supported `visitResult` values are:

- `resolved`
- `follow_up_required`
- `parts_required`
- `cannot_repair`
- `customer_unavailable`
- `cancelled_on_site`

Failure reason codes are sanitized and include:

- `transition_patch_required`
- `audit_event_invalid`
- `entity_id_required`
- `organization_id_required`
- `actor_id_required`
- `unsupported_entity_type`
- `unsupported_mobile_visit_status`
- `invalid_visit_result`
- `unsupported_audit_action`
- `organization_mismatch`
- `entity_mismatch`
- `unsafe_field_detected`
- `completion_report_boundary`
- `final_appointment_boundary`

## Sanitized Repository Result Normalization

`normalizeEngineerMobileVisitActionRepositoryResult(result)` supports sanitized success variants such as:

- `undefined`
- `null`
- `true`
- `{ ok: true }`
- `{ persisted: true }`
- `{ written: true }`
- `{ transitionPersisted: true }`
- `{ ok: true, transitionPersisted: true, auditRecorded: true }`

Safe success output contains only:

- `ok`
- `contractKind`
- `reasonCode`
- `transitionPersisted`
- `auditRecorded`

When no audit was involved, `auditRecorded` is normalized to `not_provided`.

Failure variants such as `false`, `{ ok: false }`, `{ persisted: false }`, and `{ written: false }` normalize to `repository_write_failed`.

Unknown object shapes fail closed as `repository_result_unrecognized`.

Raw errors, SQL, DB metadata, stack traces, provider payloads, customer data, report draft fields, publication data, tokens, and secrets are not exposed in normalized output.

## Completion / Field Service Report Boundary

Task1842 preserves the core Engineer Mobile boundary:

- A Case may have many appointments / dispatch visits.
- A Case must not receive a second formal Field Service Report from visit action repository validation.
- The contract rejects completion report, Field Service Report, report draft, and final appointment boundary indicators.
- `finalAppointmentId` remains backend/system-owned and is not created, inferred, exposed, or mutated.

## Future Sequence

Future work should remain separately approved and bounded:

1. synthetic DB-client repository adapter test
2. repository implementation with injected DB client
3. disposable DB dry-run only after Task1840-style approval
4. runtime bootstrap wiring only after repository contract is stable
5. global route/mount only after separate approval

## Verification

Required verification:

```bash
node --test tests/engineerMobile/engineerMobileVisitActionRepositoryContract.unit.test.js
node --test tests/engineerMobile/engineerMobileVisitActionRepositoryContractBoundary.static.test.js
node --test tests/engineerMobile/engineerMobileVisitActionPersistencePortContract.unit.test.js
node --test tests/engineerMobile/engineerMobileVisitActionPersistencePortContractBoundary.static.test.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileVisitActionRepositoryContract.js tests/engineerMobile/engineerMobileVisitActionRepositoryContract.unit.test.js tests/engineerMobile/engineerMobileVisitActionRepositoryContractBoundary.static.test.js docs/task-1842-engineer-mobile-visit-action-repository-contract-no-db-no-sql.md
```

A precise credential/sensitive scan should be limited to the four touched Task1842 files.
