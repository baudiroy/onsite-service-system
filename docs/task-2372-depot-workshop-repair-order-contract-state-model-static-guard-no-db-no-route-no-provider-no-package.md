# Task2372 Depot Workshop Repair Order Contract and State Model Static Guard

## Scope

Task2372 defines a source-reading/static contract for the future Depot / Workshop repair order / workshop job boundary.

This is a docs/static-only task. It does not add runtime write behavior, routes, controllers, repositories, DB, migrations, provider sending, package changes, smoke tests, endpoint probes, server/listener startup, admin frontend behavior, billing behavior, AI/RAG behavior, Customer Access behavior, Engineer Mobile behavior, or Repair Intake runtime behavior.

## Contract purpose

The Depot / Workshop repair order / workshop job contract is an operational/internal workflow record boundary. It is not a formal customer-facing Field Service Report approval, not a Completion Report approval, and not a `finalAppointmentId` mutation path.

The contract exists to freeze the future write boundary before any runtime implementation is authorized.

## Current source boundaries referenced

- `docs/design/depot-workshop-repair.md` exists.
- Task2371 inventory doc exists.
- `src/guards/DepotRepairStatusBoundary.js` keeps depot status transitions separate from onsite appointment completion.
- `src/guards/DepotAccessScopeGuard.js` keeps brand/service-provider/subcontractor access scoped.
- `src/services/WorkshopAssignmentService.js` prepares workshop assignment intent with `written: false`.
- `src/routes/depotRepair.routes.js` remains assignment-intent prepare-only.
- `src/depotWorkshop/depotRepairCustomerVisibleDataFilter.js` keeps customer-visible output allowlisted/projection-only.
- `src/depotWorkshop/depotWorkshopAuditBoundary.js` keeps audit events internal-only and sanitized.
- `src/repositories/DepotIntakeSqlRepositoryAdapter.js` remains injected-client/read-only over existing Repair Intake draft safe fields.

## Future repair order / workshop job contract

Safe internal fields for a future contract may include:

- `repairOrderId`
- `caseId`
- `depotIntakeId`
- `organizationId`
- `tenantId`
- `workflowType`
- `depotStatus`
- `workshopJobId`
- `workshopId`
- `workshopTeamId`
- `assignedTechnicianId`
- `subcontractorOrganizationId`
- `assignmentRelationship`
- `itemRef`
- `productRef`
- `issueSummaryRef`
- `diagnosisSummaryRef`
- `quoteSummaryRef`
- `estimateSummaryRef`
- `partsSummaryRef`
- `qcSummaryRef`
- `customerVisibleProjectionRef`
- `auditEventRef`
- `requestId`
- `createdByActorId`
- `updatedByActorId`

Forbidden fields for the future contract:

- `finalAppointmentId`
- `fieldServiceReport`
- `fieldServiceReportId`
- `completionReport`
- `completionReportId`
- `customerVisiblePublication`
- `customerName`
- `customerPhone`
- `customerAddress`
- `rawCustomerData`
- `rawDbRow`
- `rawRows`
- `providerPayload`
- `billingInternals`
- `invoice`
- `settlement`
- `aiOutput`
- `aiProviderOutput`
- `DATABASE_URL`
- `token`
- `secret`
- `sql`
- `stack`

## State model

Current source-backed state names are:

- `intake_received`
- `diagnosis_pending`
- `diagnosis_completed`
- `quote_pending`
- `quote_approved`
- `repair_in_progress`
- `quality_check`
- `ready_for_return`
- `returned`
- `cancelled`
- `closed`

`repair_waiting_parts` is a future proposal only and is not current runtime behavior.

The state model remains separate from onsite appointment completion. Depot / Workshop status changes must not create, approve, publish, revoke, or mutate a formal Field Service Report / Completion Report and must not write `finalAppointmentId`.

## Handoff and ownership context

Future repair order / workshop job records must keep these references explicit:

- Case handoff to workshop/depot.
- Repair Intake draft or depot intake source reference.
- Organization and optional tenant scope.
- Brand/service-provider/subcontractor assignment scope.
- Workshop/team/technician assignment context.
- Customer-visible projection reference only, never raw customer-visible publication behavior.
- Internal-only audit event reference.

## Customer-visible projection boundary

Customer-visible output remains allowlisted/projection-only. Future contract work must not expose raw internal diagnosis, audit log, billing internals, provider payload, AI raw output, raw customer data, raw DB rows, phone, address, or cross-organization data.

## Audit event boundary

Audit events remain internal-only and sanitized. Future audit runtime must preserve organization scope, actor attribution, request id, internal-only visibility, and forbidden payload filtering.

## Non-authorization

Task2372 does not authorize:

- New route/API/controller behavior.
- Route path or mount changes.
- Runtime write behavior.
- Repository implementation.
- DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.
- `DATABASE_URL`, Zeabur, env, or secrets inspection.
- Server/listener startup.
- Smoke test execution.
- Endpoint probes, shared runtime, deploy, staging/prod traffic, or health checks.
- Provider sending.
- Package or package-lock changes.
- Auth/session middleware changes.
- Permission model changes, role expansion, or organization isolation source changes.
- AI/RAG/OpenAI/vector DB runtime behavior or scope expansion.
- Public/open/customer route expansion.
- Customer-visible raw internal data exposure.
- Admin frontend behavior.
- Billing/settlement/payment/invoice behavior.
- Customer Access runtime behavior changes.
- Engineer Mobile runtime behavior changes.
- Repair Intake runtime behavior changes.

## Static guard coverage

The Task2372 guard asserts:

- Depot / Workshop design doc exists.
- Task2371 inventory doc exists.
- Current depot/workshop source boundaries remain visible.
- This repair order / workshop job contract is documented.
- Status model remains separate from onsite appointment completion.
- Depot/workshop repair order is operational/internal, not formal Field Service Report / Completion Report approval.
- One Case / one formal Field Service Report principle remains visible.
- `finalAppointmentId` remains system-owned and not writable by workshop/depot flow.
- Current route remains assignment-intent prepare-only and `written: false`.
- No route write scope is approved.
- Customer-visible output remains allowlisted/projection-only.
- Audit boundary remains internal-only and sanitized.
- No forbidden behavior is introduced.

## Held files

The 7 held historical docs remain outside Task2372 scope and must stay untracked, unstaged, and untouched.
