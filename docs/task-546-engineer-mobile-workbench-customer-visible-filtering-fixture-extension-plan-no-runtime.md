# Task 546 - Engineer Mobile Workbench Customer-Visible Filtering Fixture Extension Plan

## Branch Status

Task546 is docs-only.

This task defines a future fixture extension plan for customer-visible filtering.

No fixture modification.

No test file creation.

No test execution.

No runtime.

No backend source change.

No admin source change.

No DB command.

No SQL.

No DDL.

No migration.

No customer-facing report runtime.

No provider sending.

No AI/RAG/vector DB.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

## Purpose

Future customer-visible filtering tests need fixture data before a test can be safely written.

Task546 plans the fixture extension shape, scenario matrix, publication states, relationship boundaries, and future test alignment.

It does not approve editing `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js`.

It does not approve creating `customerVisibleFiltering.static.test.js`.

## Future Fixture Extension Scope

A future fixture extension may add a `customerVisibleFiltering` section or equivalent synthetic section to `repositorySynthetic.fixture.js`.

Proposed top-level shape:

```js
customerVisibleFiltering: Object.freeze({
  allowedKeys: Object.freeze([...]),
  forbiddenKeys: Object.freeze([...]),
  reportPublicationStates: Object.freeze([...]),
  accessScenarios: Object.freeze([...]),
  escalationScenarios: Object.freeze([...])
})
```

The exact shape is proposal-only and must be approved in a later PM task before fixture modification.

## Allowed Customer-visible Key Proposal

Future allowed keys may include only safe customer-facing fields:

- caseDisplayId
- customerFacingStatus
- appointmentWindowSummary
- serviceDate
- productCategory
- modelSummary
- issueSummary
- completionSummary
- replacedPartSummary
- publicPhotoRefs
- signatureSummary
- feeCustomerSummary
- warrantyOrCareNotes
- followUpAction
- customerSupportContact

Design rules:

- Allowed keys must be explicit.
- Allowed keys must be synthetic in fixture.
- No raw internal object should be exposed as customer-visible output.
- Customer-visible output should be an allow-list projection, not a deny-list cleanup of raw data.

## Forbidden Customer-visible Key Proposal

Future forbidden keys must include:

- internalNote
- auditLog
- aiRawPayload
- aiConfidenceScore
- aiRiskFlag
- providerPayload
- billingInternalData
- settlementInternalData
- engineerInternalComment
- supervisorReview
- dispatchInternalReason
- unapprovedFieldServiceReportDraft
- completionSubmissionRawPayload
- customerChannelIdentityInternal
- lineUserId
- rawFileBinary
- rawPhotoBinary
- rawSignatureBinary
- token
- secret
- DATABASE_URL

Design rules:

- Forbidden markers may exist in fixture only as harmless synthetic marker keys.
- Forbidden markers must never include real value payloads.
- Customer-facing projection tests should prove forbidden keys are absent from customer-visible output.

## Future Customer Access Scenarios

Future fixture scenarios may include:

| Scenario | Purpose | Expected visibility | Safe-deny / escalation behavior | Forbidden leakage | Fixture marker proposal |
| --- | --- | --- | --- | --- | --- |
| verified customer linked to published report | happy path customer report view | visible | none | no internal data | `customer_visible_published_report` |
| verified customer linked to unpublished draft | report not ready | not visible | safe-deny or not-yet-ready | no draft | `customer_report_unpublished_safe_deny` |
| unverified customer identity | identity not trusted | not visible | safe-deny | no case existence leak | `customer_unverified_safe_deny` |
| verified customer not linked to Case | wrong customer | not visible | safe-deny | no case existence leak | `customer_unlinked_case_safe_deny` |
| customer from another organization | cross-tenant attempt | not visible | safe-deny | no cross-org data | `customer_cross_org_safe_deny` |
| report with complaint / low rating | follow-up needed | limited | escalation marker | no suppression | `customer_report_follow_up_required` |
| disputed service result | human review needed | limited | human follow-up | no internal dispute notes | `customer_disputed_service_follow_up` |
| fee dispute | fee follow-up needed | limited | human follow-up | no settlement internals | `customer_fee_dispute_follow_up` |
| AI generated summary not human-confirmed | internal draft only | not visible | withhold draft | no AI raw payload | `customer_ai_draft_internal_only` |
| signature exception | customer-safe summary | visible if approved | review marker if needed | no raw signature data | `customer_signature_exception_safe_summary` |

Each future scenario must include:

- purpose.
- expected visibility.
- safe-deny / escalation behavior.
- forbidden leakage.
- fixture marker proposal.

## Report Publication State Proposal

Future publication states may include:

- `draft_internal`
- `source_data_submitted`
- `needs_review`
- `approved_internal_fsr`
- `customer_report_published`
- `customer_report_withheld`
- `customer_follow_up_required`
- `disputed`

These states are proposal-only.

No enum is added.

No DB field is added.

No runtime transition is added.

`approved_internal_fsr` does not automatically mean customer-visible.

`customer_report_published` must be an explicit future workflow.

## Relationship Boundaries

- Completion submission source-data is internal source material.
- Formal Field Service Report is Case-level formal report.
- Customer-facing service report is a filtered view / publication, not another conflicting formal report.
- One Case ultimately has one formal Field Service Report.
- Multiple completion submissions do not create multiple formal Field Service Reports.
- Customer-facing report cannot include unapproved draft or internal-only data.
- AI normalized draft cannot be customer-visible unless human-confirmed and approved through future workflow.

## Future Static Test Plan Alignment

Future `customerVisibleFiltering.static.test.js` may verify:

- allowed key list exists.
- forbidden key list exists.
- each customer access scenario has expected visibility.
- unpublished draft is not customer-visible.
- unverified / unlinked / cross-org customer access safe-denies.
- internal notes / audit / AI / provider / billing / settlement keys are forbidden.
- raw binary is forbidden.
- customer-facing published report uses allowed keys only.
- complaint / dispute scenarios require escalation / follow-up marker.
- no real PII / token / secret / LINE id in fixture.

## Current Blockers

- Fixture modification not authorized in Task546.
- Test implementation not authorized in Task546.
- Customer-facing report runtime not authorized.
- Formal FSR workflow not authorized.
- Completion persistence runtime not authorized.
- DB metadata-only inspection not approved.
- Actual applied schema unverified.
- Repository runtime not authorized.
- AI/RAG/vector DB not authorized.

## Planning Conclusion

READY FOR FUTURE CUSTOMER-VISIBLE FIXTURE EXTENSION TASK

Task546 does not approve fixture modification.

Task546 does not approve test implementation.

Task546 does not approve test execution.

Task546 does not approve runtime.

Task546 does not approve DB access.

Task546 does not approve migration.

Any future fixture/test file touch requires separate PM task with exact allowed files.

## Future Sequencing

Future tasks may include, but are not executed here:

- Task547: Customer-Visible Filtering Fixture Extension / No Runtime / No Test Execution.
- Task548: Customer-Visible Filtering Static Test File Touch Plan / No Runtime.
- Task549: Customer-Facing Service Report Visibility Boundary Review / No Runtime.
- Task550: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task551: PM Continuation Handoff Summary / No Runtime Change.

## Completion Checklist

- Modified files: this Task546 markdown file only.
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

CUSTOMER-VISIBLE FILTERING FIXTURE EXTENSION PLAN IS READY FOR FUTURE PM REVIEW.

READY FOR FUTURE CUSTOMER-VISIBLE FIXTURE EXTENSION TASK.

CURRENT RUNTIME REMAINS SKELETON-ONLY.

CURRENT ENDPOINTS REMAIN `501 Not Implemented`.

DB INSPECTION PENDING EXPLICIT USER APPROVAL.

NO RUNTIME APPROVAL.

NO MIGRATION APPROVAL.

NO CUSTOMER-FACING SERVICE REPORT RUNTIME APPROVAL.

NO FIXTURE OR TEST FILE TOUCH APPROVAL FROM TASK546.
