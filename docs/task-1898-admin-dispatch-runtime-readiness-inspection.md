# Task1898 Admin Dispatch Runtime Readiness Inspection

Status: inspection completed. No runtime/source changes.

## Current Baseline

- `origin/main`: `3d581b9a784c79378758fd5dae13431e17b43332`
- Local `main`: synchronized with `origin/main` before this task.
- Phase: Phase 10, Admin / Dispatch / Operations Runtime.
- This task is inspection/readiness only.

## Scope

This task inspected existing Admin Dispatch, appointment, dispatch unit, repository, service, route, permission, audit, and design boundaries without executing DB, SQL, migration, seed, smoke, deploy, provider, AI/RAG, billing, or Zeabur work.

## Existing Runtime and Route Evidence

- `src/routes/index.js`
  - Mounts `dispatchRouter` at `/api/v1/admin/cases/:caseId/dispatch`.
  - Mounts `caseAppointmentsRouter` at `/api/v1/admin/cases/:caseId/appointments`.
  - Mounts `appointmentsRouter` at `/api/v1/admin/appointments`.
  - Mounts `dispatchUnitsRouter` at `/api/v1/admin/dispatch-units`.
- `src/routes/dispatch.routes.js`
  - `POST /` requires `dispatch.manage`.
  - `PATCH /` requires `dispatch.manage`.
  - Both paths validate request payloads before controller dispatch.
- `src/routes/appointments.routes.js`
  - Case appointment create/list and appointment update paths require `appointments.manage`.
- `src/routes/dispatchUnits.routes.js`
  - Dispatch unit management paths require `dispatch_units.manage`.
- `src/controllers/DispatchController.js`
  - Delegates create/update to `DispatchService`.
  - Does not implement route-level DB access directly.
- `src/controllers/AppointmentController.js`
  - Delegates create/update/list to `AppointmentService`.
  - Does not implement route-level DB access directly.

## Existing Repository and Service Evidence

- `src/repositories/DispatchRepository.js`
  - Provides `createDispatchAssignment`, `getDispatchAssignmentByCaseId`, `getDispatchAssignmentById`, `updateDispatchAssignment`, and `listDispatchAssignments`.
  - Uses parameterized SQL.
  - Can receive an injected client through `BaseRepository`, but the default constructor path inherits the global pool.
  - Returns raw DB rows and is currently used by runtime services.
- `src/repositories/AppointmentRepository.js`
  - Provides appointment create/read/update/list helpers.
  - Contains open appointment and final eligible appointment read helpers.
  - Does not itself mutate `finalAppointmentId`; final appointment selection is handled in Field Service Report service boundaries.
- `src/repositories/DispatchUnitRepository.js`
  - Supports dispatch unit CRUD/list behavior.
  - Uses organization filters for list operations.
- `src/services/DispatchService.js`
  - Validates case status before dispatch assignment.
  - Uses `OrganizationAccessService.assertAccess` for case organization isolation.
  - Validates engineer membership in the case organization.
  - Validates dispatch unit belongs to the same organization as the case.
  - Creates/updates dispatch assignment, updates case dispatch summary, creates workflow message, and records audit events in one transaction.
- `src/services/AppointmentService.js`
  - Validates appointment time ranges and appointment completion consistency.
  - Guards against multiple open appointments per case.
  - Validates explicit dispatch assignment belongs to the same case.
  - Creates workflow messages and audit events for appointment changes.

## Permission and Organization Isolation Evidence

- `src/middlewares/requirePermission.js`
  - Requires authentication and permission key membership.
  - Dispatch routes require `dispatch.manage`.
  - Appointment routes require `appointments.manage`.
  - Dispatch unit routes require `dispatch_units.manage`.
- `src/services/OrganizationAccessService.js`
  - Provides organization access assertion and scoped filter helpers.
  - Allows system/super admin and otherwise checks user organization membership.
- `DispatchService` currently verifies organization access through the case row and verifies engineer/dispatch unit organization compatibility.

## Audit and Message Evidence

- `src/services/AuditService.js`
  - Records audit events through `AuditLogRepository`.
- `DispatchService` records:
  - `dispatch.created`
  - `dispatch.engineer_assigned`
- `AppointmentService` records:
  - `appointment.created`
  - appointment update/reschedule/cancel actions.
- `DispatchService` and `AppointmentService` both create workflow timeline messages.

## Schema and Migration File Evidence

Inspection only; no DB or migration command was run.

- `migrations/006_create_dispatch_appointment_tables.sql`
  - Defines `dispatch_assignments`.
  - Defines `appointments`.
  - Adds indexes for case, dispatch unit, assigned engineer, status, and appointment schedule lookups.
- `migrations/007_dispatch_assignment_auditability.sql`
  - Adds assignment auditability fields such as assigned/reassigned actor metadata.
- `migrations/018_add_visit_result_fields_to_appointments.sql`
  - Adds visit result and multi-visit appointment fields.
- `migrations/019_add_final_appointment_id_to_field_service_reports.sql`
  - Adds `field_service_reports.final_appointment_id`.
  - This remains outside dispatch assignment scope.
- `migrations/023_engineer_mobile_visit_action_persistence_fields.sql`
  - Adds engineer mobile visit-action persistence fields to appointments.
  - This remains outside admin dispatch assignment scope.

## Design Evidence

- `docs/design/dispatch-appointment-confirmation.md`
  - Dispatch is a decision layer.
  - AI suggestions must remain human-in-the-loop.
  - Formal appointment/customer confirmation must not be bypassed.
  - Confirmation and contact logs are future scope.
- `docs/design/case-first-contact-dispatch-intake.md`
  - First contact can collect dispatch intake drafts.
  - Dispatch intake becomes formal dispatch input only after human confirmation.
  - AI first-call intake is low-risk assistant behavior only and must not promise appointment, quote, compensation, settlement, or special commitments.

## Existing Test Evidence

- `tests/historicalDirtyStack/appointmentDispatchHistoricalSourceBaseline.unit.test.js`
  - Synthetic baseline around `DispatchRepository.getDispatchAssignmentById`.
  - Synthetic `AppointmentService.ensureDispatchAssignmentForCase` behavior.
- `tests/historicalDirtyStack/appointmentDispatchCreateAppointmentHistoricalSource.unit.test.js`
  - Synthetic appointment creation boundary around explicit dispatch assignment checks.
- Existing engineer mobile and workbench tests also cover appointment/assignment read-model safety, but they are adjacent read-only branches rather than Admin Dispatch write runtime authority.

## Core Invariants Confirmed

- Appointment lifecycle is backend/system-owned.
- `finalAppointmentId` must not be casually mutated.
- Dispatch assignment must remain organization-isolated.
- Admin route/controller must not bypass permission guard.
- Assignment changes must be auditable.
- Provider sending is not part of dispatch assignment.
- AI/RAG is not part of dispatch assignment unless explicitly scoped later.
- Billing provider execution is not part of dispatch assignment.
- Customer-visible publication is not part of dispatch assignment.
- Completion Report / Field Service Report creation, approval, publication, revocation, or mutation is not part of dispatch assignment.

## Readiness Findings

- Existing runtime services are broad and DB-backed through transaction and repository defaults.
- Existing `DispatchRepository` supports parameterized SQL and injected constructor client, but it still inherits a global-pool default through `BaseRepository` and returns raw DB rows.
- Task1899 should avoid changing the existing runtime service path.
- The safest next implementation target is a separate injected-only repository adapter that:
  - requires an explicit `dbClient`;
  - uses parameterized SQL;
  - returns normalized/sanitized result envelopes;
  - supports future assignment service behavior;
  - does not import `BaseRepository`, app/server, routes, controllers, transaction helpers, pool, providers, AI, billing, or Field Service Report modules.

## Recommended Task1899 Target

Recommended implementation target:

- Add a Dispatch Assignment injected repository adapter under a dedicated module path.
- Add synthetic `dbClient` tests only.
- Add static boundary tests for no global pool, no direct `DATABASE_URL`, no app/server import, no migration/seed/smoke/deploy/provider/AI/billing/FSR/finalAppointmentId/customer-visible publication behavior.
- Keep the adapter detached from live runtime route wiring until a later accepted service/route task.

Task1899 should not:

- Run a real DB query.
- Use `DATABASE_URL`.
- Construct or import a global pool.
- Import app/server/routes/controllers.
- Apply any migration.
- Start runtime.
- Run smoke.
- Assign appointments in a real DB.
- Mutate appointment lifecycle in a real DB.
- Mutate `finalAppointmentId`.
- Create, approve, publish, revoke, or mutate Completion Report / Field Service Report behavior.
- Provider-send, billing-send, or AI/RAG execute.

## Verification Summary

- This task did not modify runtime/source files.
- This task did not add or modify tests.
- This task did not execute DB, SQL, migration, seed, smoke, deploy, provider, AI/RAG, billing, or Zeabur commands.
- The intended project check is `npm run check`; in this shell `npm` is unavailable, so the package.json-equivalent `find src -name '*.js' -print0 | xargs -0 -n1 node --check` should be used.
