# Task 554 - Engineer Mobile Workbench Customer-facing Report DTO Contract Proposal

## Branch Status

Task554 is docs-only.

This task proposes a future customer-facing report DTO contract and safe-deny / unavailable response boundary.

No DTO implementation.

No runtime approval.

No backend source change.

No admin source change.

No DB command.

No SQL.

No DDL.

No migration approval.

No fixture modification.

No test file creation.

No test execution.

No repository runtime.

No completion persistence runtime.

No appointment state transition runtime.

No formal Field Service Report workflow implementation.

No customer-facing service report runtime.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

## Purpose

Future customer-facing report runtime needs a strict DTO boundary before implementation.

This proposal defines a safe customer-facing DTO shape, unavailable response shape, safe-deny response shape, publication state mapping, identity / permission / scope requirements, and forbidden data categories.

It does not authorize creating DTO code, projection code, API runtime, DB schema, tests, or customer-facing report publication runtime.

## DTO Design Principles

The customer-facing report DTO must be an allow-list projection.

It must not be a raw Field Service Report dump.

It must not be raw completion submission source-data.

It must not include internal-only fields by omission cleanup alone.

It must be built from customer-visible approved fields.

It must be explicit, versionable, and safe for customer channels such as LINE, Web link, future App, or email.

Future DTO creation requires verified customer identity, Case linkage, organization scope, publication state, and customer-visible data policy.

## Published DTO Proposal

Future published customer-facing report DTO may include:

```json
{
  "status": "published",
  "reportVersion": "proposal-only",
  "caseDisplayId": "synthetic-case-display-id",
  "serviceDateSummary": "customer-safe service date summary",
  "appointmentWindowSummary": "customer-safe appointment window summary",
  "productSummary": "customer-safe product summary",
  "reportedIssueSummary": "customer-safe reported issue summary",
  "reviewedWorkPerformedSummary": "human-reviewed work performed summary",
  "reviewedResolutionSummary": "human-reviewed resolution summary",
  "customerVisiblePartsSummary": "customer-safe parts summary",
  "signatureStatusSummary": "customer-safe signature status",
  "signatureExceptionCustomerSafeSummary": "customer-safe signature exception summary when applicable",
  "approvedPhotoEvidenceRefs": [],
  "publishedServiceStatus": "customer-safe status",
  "customerFollowUpStatus": "customer-safe follow-up status",
  "supportAction": "customer-safe support next step"
}
```

This proposal is illustrative only.

No schema is added.

No API is added.

No DTO runtime is implemented.

No customer-facing publication workflow is implemented.

## Published DTO Allowed Fields

Future DTO fields may include:

- `status`
- `reportVersion`
- `caseDisplayId`
- `serviceDateSummary`
- `appointmentWindowSummary`
- `productSummary`
- `reportedIssueSummary`
- `reviewedWorkPerformedSummary`
- `reviewedResolutionSummary`
- `customerVisiblePartsSummary`
- `signatureStatusSummary`
- `signatureExceptionCustomerSafeSummary`
- `approvedPhotoEvidenceRefs`
- `publishedServiceStatus`
- `customerFollowUpStatus`
- `supportAction`

Allowed fields still require:

- verified customer identity.
- Case linkage.
- organization scope match.
- publication state allowing customer view.
- permission-aware read model.
- customer-visible data policy.
- sensitive data redaction.
- audit policy.

Allowed fields are not automatically visible.

Draft/source-data fields require review before becoming customer-visible.

## Forbidden DTO Fields

Future customer-facing report DTO must not include:

- `internalNote`
- `auditLog`
- `aiRawPayload`
- `aiConfidenceScore`
- `providerRawPayload`
- `billingInternalData`
- `settlementInternalData`
- `vendorSettlementRules`
- `internalEngineerComment`
- `supervisorReviewNote`
- `unconfirmedDispatchSuggestion`
- `unapprovedFsrDraft`
- `rawCompletionSubmissionPayload`
- `rawEngineerInputSnapshot`
- `validationResultSnapshot` if internal.
- `rejectedClientAuthorityFieldsSnapshot`
- `rawPhotoBinary`
- `rawSignatureBinary`
- `token`
- `secret`
- `DATABASE_URL`
- raw `line_user_id`
- raw channel identity internals.
- internal dispute notes.
- internal follow-up notes.
- AI normalized draft before human confirmation.
- internal cost / margin data.
- provider reconciliation data.
- engineer private contact details.
- cross-organization data.

Forbidden fields must not appear in customer-facing DTOs, customer-facing unavailable responses, safe-deny responses, customer notifications, or customer-facing AI context.

## Unavailable DTO Proposal

Future unavailable response proposal:

```json
{
  "status": "not_available",
  "reasonCode": "generic_customer_safe_reason",
  "messageKey": "customer_report_not_available",
  "canContactSupport": true,
  "nextAction": "contact_support_or_wait_for_follow_up",
  "followUpStatus": "customer-safe optional summary"
}
```

Unavailable response rules:

- Must not reveal internal workflow reason.
- Must not reveal unpublished draft exists if unsafe.
- Must not reveal internal approval status.
- Must not reveal another customer / organization / Case exists.
- Must not reveal report existence when non-enumeration is required.
- Should route complaint / dispute / low rating to follow-up when appropriate.
- May expose only customer-safe status and next action.

## Safe-deny DTO Proposal

Future safe-deny response proposal:

```json
{
  "status": "not_available",
  "reasonCode": "not_accessible",
  "messageKey": "resource_not_available",
  "canContactSupport": true,
  "nextAction": "contact_support"
}
```

Safe-deny applies to:

- unverified customer.
- customer not linked to Case.
- cross-organization access.
- report not visible.
- Case not found / not accessible.
- unpublished draft where non-enumeration is required.

Safe-deny rules:

- Generic response shape.
- No resource enumeration.
- No organization existence leak.
- No Case existence leak.
- No report existence leak.
- No internal reason in customer-facing output.
- Internal audit/log can record reason in future, but not in DTO.

## Publication State Mapping

Proposal-only state mapping:

| Publication state | Future DTO behavior |
| --- | --- |
| `draft_internal` | safe unavailable / not exposed |
| `source_data_submitted` | safe unavailable / not exposed |
| `needs_review` | safe unavailable / optional follow-up |
| `approved_internal_fsr` | not automatically customer-visible |
| `customer_report_published` | published DTO allowed |
| `customer_report_withheld` | unavailable / follow-up |
| `customer_follow_up_required` | unavailable or limited follow-up DTO |
| `disputed` | follow-up DTO / human handling |

No enum is added.

No DB field is added.

No runtime transition is added.

No publication workflow is implemented.

## Identity / Permission / Scope Requirements

Future DTO creation requires:

- verified customer identity.
- customer linked to Case.
- organization scope match.
- report publication state allows customer view.
- permission-aware read model.
- customer-visible data policy.
- no cross-organization fallback.
- no global LINE identity lookup.
- no raw customer channel identity internals.

The DTO must not depend on raw LINE identity.

LINE, Web link, App, SMS, or email delivery must all use the same customer-visible data policy.

## Relationship to Formal FSR and Source-data

Completion submission source-data is not DTO source directly.

Formal Field Service Report is the Case-level formal report.

Customer-facing report is filtered publication view.

One Case ultimately has one formal FSR.

Customer-facing DTO must not create a second formal report.

Multiple completion submissions do not create multiple customer-facing reports unless future publication rules explicitly define versioning.

`finalAppointmentId` remains system-owned and not customer-selectable.

## Complaint / Dispute / Escalation Behavior

Complaint / low rating / negative feedback must not be hidden.

AI may summarize or classify feedback, but AI cannot suppress negative feedback.

AI cannot auto-close complaint.

Disputed service result requires human follow-up.

Fee dispute requires human follow-up.

DTO may expose customer-safe follow-up status but not internal dispute notes.

Customer-facing report publication may be withheld or limited if dispute is unresolved.

This is proposal-only and does not implement follow-up / escalation workflow.

## Static Test Alignment

Future static tests may verify:

- allowed field list.
- forbidden field list.
- safe-deny envelope.
- unavailable envelope.
- publication state mapping.
- identity/access requirements.
- no internal-only leakage.
- no raw binary.
- no secrets / PII / cross-org data.
- three-layer report model.

Task554 does not create tests.

## Current Blockers

- Customer-facing report runtime not authorized.
- Customer-facing DTO implementation not authorized.
- Formal FSR workflow not authorized.
- Completion persistence runtime not authorized.
- Repository runtime not authorized.
- DB metadata-only inspection not approved.
- Actual applied schema unverified.
- Fixture/test implementation beyond current baseline not authorized in Task554.
- AI/RAG/vector DB not authorized.

## Contract Conclusion

DTO CONTRACT PROPOSAL READY - NO RUNTIME AUTHORIZED

Task554 does not approve DTO implementation.

Task554 does not approve customer-facing runtime.

Task554 does not approve formal FSR workflow.

Task554 does not approve repository runtime.

Task554 does not approve DB access.

Task554 does not approve migration.

Any future DTO / runtime / fixture / test file touch requires a separate PM task with exact allowed files.

## Future Sequencing

Future tasks may include, but are not executed here:

- Task555: Customer-Facing DTO Static Contract Test Planning / No Runtime.
- Task556: Customer Identity Access Boundary Review / No Runtime.
- Task557: Customer-Facing Report Publication State Matrix / No Runtime.
- Task558: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task559: PM Continuation Handoff Summary / No Runtime Change.

## Completion Checklist

- Modified files: this Task554 markdown file only.
- Docs-only: yes.
- No DTO implementation.
- No runtime approval.
- No backend `src/` change.
- No `admin/src/` change.
- No fixture modification.
- No test file creation.
- No test execution.
- No DB command.
- No migration approval.
- Customer-facing report runtime not authorized.
- Formal FSR workflow not authorized.
- No repository runtime.
- No package change.
- No provider sending.
- No AI/RAG/vector DB.
- No sensitive data copied.
