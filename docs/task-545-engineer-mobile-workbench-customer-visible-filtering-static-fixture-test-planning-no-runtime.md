# Task 545 - Engineer Mobile Workbench Customer-Visible Filtering Static Fixture/Test Planning

## Branch Status

Task545 is docs-only.

This task plans future customer-visible filtering fixture/test coverage for Engineer Mobile Workbench and customer-facing service report boundaries.

No fixture modification.

No test file creation.

No test file modification.

No test execution.

No runtime.

No backend source change.

No admin source change.

No DB command.

No SQL.

No DDL.

No migration.

No provider sending.

No AI/RAG/vector DB.

No customer-facing service report runtime.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

## Purpose

Customer-visible filtering is a future safety boundary.

It must ensure customer-facing views do not expose internal data, source-data drafts, audit logs, AI raw payloads, billing / settlement internals, provider payloads, raw binary data, or cross-organization data.

Task545 only plans the future fixture/test shape.

It does not approve fixture extension, test implementation, runtime implementation, DB inspection, migration, or customer-facing report generation.

## Read-only References

Task545 may use the following as read-only references:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-542-pm-continuation-handoff-after-safe-deny-static-test-baseline-no-runtime-change.md`
- `docs/task-544-pm-continuation-handoff-after-completion-submission-idempotency-static-test-baseline-no-runtime-change.md`
- `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.repositorySyntheticFixture.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.repositoryStaticContract.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.completionSubmissionForbiddenPayload.static.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.organizationIsolation.static.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.appointmentStateEligibility.static.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.safeDenyMatrix.static.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.completionSubmissionIdempotency.static.test.js`

Task545 does not modify any reference.

If a reference is missing in a future run, it must be reported as `reference not found / not inspected`, not recreated.

## Customer-visible Filtering Boundary

Future customer-visible filtering should separate:

- internal Field Service Report data.
- completion submission source-data.
- customer-facing service report projection.
- customer-visible appointment status.
- customer-visible case status.
- customer-facing follow-up / issue reporting.
- internal audit / risk / billing / settlement / AI data.

The customer-facing projection should be an allow-list, not a raw data dump.

Customer-visible output may include safe summaries only when:

- the customer identity is verified.
- the Case is linked to the verified customer identity.
- the Case is within the correct organization scope.
- the report or status is approved / published for customer visibility.
- field-level masking and customer-visible data policy are applied.

## Future Fixture Extension Plan

A future fixture extension may add customer-visible filtering examples, but Task545 does not authorize that modification.

Future fixture data may include:

| Proposed fixture item | Purpose | Customer-visible | Sensitive data risk | Future static assertion target | Fixture modification requires separate PM task |
| --- | --- | --- | --- | --- | --- |
| `customerVisibleAllowedKeys` | Allow-list of fields safe for customer-facing projection | yes | low if synthetic | Assert only explicit keys are exposed | yes |
| `customerVisibleForbiddenKeys` | Forbidden internal fields for customer-facing projection | no | high | Assert internal keys never appear in customer-facing output | yes |
| `customerFacingReportDraft` | Synthetic draft before approval/publish | no | medium | Assert draft cannot be exposed as final report | yes |
| `customerFacingReportPublished` | Synthetic published projection | yes | low if synthetic | Assert safe summary shape and masking | yes |
| `customerFacingReportNotPublished` | Synthetic unpublished report state | no | medium | Assert safe-deny until published | yes |
| `customerVerifiedIdentity` | Synthetic verified customer identity marker | yes, as marker only | medium | Assert customer-visible access requires verification | yes |
| `customerUnverifiedIdentity` | Synthetic unverified customer identity marker | no | medium | Assert safe-deny | yes |
| `customerCaseLink` | Synthetic link between customer identity and Case | yes, as marker only | medium | Assert Case link required | yes |
| `customerCrossOrgCaseAttempt` | Cross-organization customer access denied marker | no | high | Assert no cross-org customer leakage | yes |
| `customerInternalNoteExample` | Internal note forbidden marker | no | high | Assert internal notes are never customer-visible | yes |
| `customerAuditLogExample` | Audit log forbidden marker | no | high | Assert audit logs are never customer-visible | yes |
| `customerAiRawPayloadExample` | AI raw payload forbidden marker | no | high | Assert AI raw payload is never customer-visible | yes |
| `customerBillingSettlementInternalExample` | Billing / settlement internal marker | no | high | Assert billing / settlement internals are never customer-visible | yes |
| `customerRawBinaryExample` | Raw photo/signature/file forbidden marker | no | high | Assert only object metadata / published asset refs may appear | yes |
| `customerAccessDeniedMarker` | Generic customer safe-deny marker | no | medium | Assert denial is safe and non-enumerating | yes |

## Future Pure Static Test Planning

Future test proposal:

- `tests/engineerMobileWorkbench/engineerMobileWorkbench.customerVisibleFiltering.static.test.js`

That future test should verify:

- customer-visible allowed keys are explicit.
- forbidden internal keys are not customer-visible.
- raw completion submission is not directly exposed.
- AI raw payload is not customer-visible.
- audit log is not customer-visible.
- billing / settlement internal data is not customer-visible.
- internal engineer notes are not customer-visible.
- customer-facing report cannot include unapproved FSR draft.
- cross-organization customer data cannot leak.
- no token / secret / `DATABASE_URL`.
- no raw binary exposure.

The future test must import only approved fixture data.

It must not import backend runtime, repositories, services, DB, controller, resolver, guard, projection, provider clients, or AI/RAG/vector DB clients.

## Safe-deny / Escalation Boundary for Customer-visible Output

Future customer-visible filtering must preserve these boundaries:

- If customer identity is not verified, safe-deny.
- If Case is not linked to verified customer identity, safe-deny.
- If report is not approved / published, do not expose draft.
- If negative feedback / complaint exists, do not hide or auto-close.
- If customer disputes result / fee / service status, route to human follow-up.
- AI may summarize but cannot suppress negative feedback or modify rating.
- AI cannot publish customer-facing report.

Safe-deny responses must not reveal whether another Case, appointment, customer identity, report, phone, LINE identity, or organization record exists.

## Guardrail Invariants

- One Case ultimately has one formal Field Service Report.
- Customer-facing service report is a filtered view, not a separate conflicting formal report.
- Completion submissions remain source-data.
- Multiple completion submissions do not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- Engineers cannot manually select `finalAppointmentId`.
- Completion submission does not mean Case completed.
- No survey / provider / billing / settlement / AI approval trigger.
- Customer-facing report must not expose internal note / audit / AI raw payload / billing settlement internals.
- Every future read must be organization-scoped and permission-aware.

## Current Blockers

- Customer-facing report runtime not authorized.
- Formal Field Service Report workflow not authorized.
- Completion persistence runtime not authorized.
- DB metadata-only inspection not approved.
- Actual applied schema unverified.
- Repository runtime not authorized.
- Fixture modification not authorized in Task545.
- Test implementation not authorized in Task545.
- AI/RAG/vector DB not authorized.

## Planning Conclusion

PARTIAL — NEEDS FIXTURE EXTENSION PLAN FIRST

Task545 does not approve fixture modification.

Task545 does not approve test implementation.

Task545 does not approve test execution.

Task545 does not approve runtime.

Task545 does not approve DB access.

Task545 does not approve migration.

Any future fixture/test file touch requires separate PM task with exact allowed files.

## Future Sequencing

Future tasks may include, but are not executed here:

- Task546: Customer-Visible Filtering Fixture Extension Plan / No Runtime.
- Task547: Customer-Visible Filtering Static Test File Touch Plan / No Runtime.
- Task548: Customer-Facing Service Report Visibility Boundary Review / No Runtime.
- Task549: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task550: PM Continuation Handoff Summary / No Runtime Change.

## Completion Checklist

- Modified files: this Task545 markdown file only.
- Docs-only: yes.
- No fixture modification.
- No test file creation.
- No test execution.
- No runtime approval.
- No DB command.
- No migration approval.
- Customer-facing report runtime not authorized.
- No backend `src/` change.
- No `admin/src/` change.
- No smoke or package change.
- No sensitive data copied.

## Handoff Conclusion

CUSTOMER-VISIBLE FILTERING STATIC FIXTURE/TEST PLANNING IS PARTIAL.

PARTIAL — NEEDS FIXTURE EXTENSION PLAN FIRST.

CURRENT RUNTIME REMAINS SKELETON-ONLY.

CURRENT ENDPOINTS REMAIN `501 Not Implemented`.

DB INSPECTION PENDING EXPLICIT USER APPROVAL.

NO RUNTIME APPROVAL.

NO MIGRATION APPROVAL.

NO CUSTOMER-FACING SERVICE REPORT RUNTIME APPROVAL.

NO FIXTURE OR TEST FILE TOUCH APPROVAL FROM TASK545.
