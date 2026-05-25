# Task 555 - Engineer Mobile Workbench Customer-facing DTO Static Contract Test Planning

## Branch Status

Task555 is docs-only.

This task plans a future customer-facing DTO static contract test after the Task554 DTO contract proposal.

No DTO implementation.

No fixture modification.

No test file creation.

No test execution.

No runtime approval.

No DB command.

No SQL.

No DDL.

No migration approval.

No repository runtime.

No completion persistence runtime.

No appointment state transition runtime.

No formal Field Service Report workflow implementation.

No customer-facing service report runtime.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

## Purpose

Future static tests should verify the customer-facing DTO contract before runtime implementation.

This task defines the planned test file, target markers, assertions, blockers, and sequencing.

It does not authorize fixture edits or test implementation.

The current fixture has customer-visible filtering markers, but does not yet have dedicated customer-facing DTO envelope markers for published, unavailable, and safe-deny response shapes.

## Future Test File Proposal

Future test file proposal:

```text
tests/engineerMobileWorkbench/engineerMobileWorkbench.customerFacingDtoContract.static.test.js
```

Future test requirements:

- Use Node built-in `node:test`.
- Use Node built-in `node:assert/strict`.
- Import only `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js`.
- Do not import backend runtime.
- Do not import repository / DB / controller / resolver / service.
- Do not call DB / provider / AI.
- Do not use real PII.
- Do not execute full suite.
- Execute only the single future test file after a separate explicit PM task authorizes it.

## Needed Future DTO Fixture Markers

Before the proposed test can be implemented cleanly, a future fixture extension should add DTO-oriented markers such as:

- `customerFacingPublishedDtoProposal`
- `customerFacingUnavailableDtoProposal`
- `customerFacingSafeDenyDtoProposal`
- `customerFacingDtoAllowedFields`
- `customerFacingDtoForbiddenFields`
- `customerFacingPublicationStateDtoMapping`
- `customerFacingDtoInvariantNotes`

These names are proposal-only.

Task555 does not approve adding them.

## Published DTO Field Assertions

Future assertions should verify that a published DTO proposal can expose only explicit customer-safe fields:

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

Future assertions should verify:

- allowed fields are explicit.
- allowed fields are proposal-only.
- `approvedPhotoEvidenceRefs` are refs only, not raw binary.
- `supportAction` / support contact must not expose internal staff private data.
- allowed fields still require identity, scope, publication, and customer-visible policy checks.

## Forbidden DTO Field Assertions

Future assertions should verify that customer-facing DTO markers never include:

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
- `validationResultSnapshot`
- `rejectedClientAuthorityFieldsSnapshot`
- `rawPhotoBinary`
- `rawSignatureBinary`
- `token`
- `secret`
- `DATABASE_URL`
- `customerChannelIdentityInternals`
- `crossOrganizationData`
- engineer private contact details.
- internal cost / margin data.
- provider reconciliation data.
- internal dispute notes.
- internal follow-up notes.

Forbidden markers may exist in fixture only as harmless marker keys, not values.

## Unavailable DTO Assertions

Future assertions should verify:

- unavailable response uses generic customer-safe `reasonCode`.
- unavailable response does not reveal unpublished draft exists if unsafe.
- unavailable response does not reveal internal approval status.
- unavailable response does not reveal another customer / organization / Case / report exists.
- complaint / dispute / low rating routes to follow-up when appropriate.
- `followUpStatus` is customer-safe only.

## Safe-deny DTO Assertions

Future assertions should verify:

- unverified customer gets generic safe-deny.
- unlinked customer / Case gets generic safe-deny.
- cross-organization customer access gets generic safe-deny.
- report not visible gets generic safe-deny where non-enumeration is required.
- no resource enumeration.
- no organization existence leak.
- no Case existence leak.
- no report existence leak.
- no internal reason in customer-facing output.

## Publication State Mapping Assertions

Future assertions should verify:

- `draft_internal` -> not customer-visible.
- `source_data_submitted` -> not customer-visible.
- `needs_review` -> unavailable / optional follow-up.
- `approved_internal_fsr` -> not automatically customer-visible.
- `customer_report_published` -> published DTO allowed.
- `customer_report_withheld` -> unavailable / follow-up.
- `customer_follow_up_required` -> limited follow-up DTO.
- `disputed` -> follow-up / human handling.

No enum is added.

No DB field is added.

No runtime transition is added.

## Three-layer Model Assertions

Future assertions should verify:

- completion submission source-data is not DTO source directly.
- formal Field Service Report is Case-level formal report.
- customer-facing report is filtered publication view.
- one Case ultimately has one formal FSR.
- customer-facing DTO must not create a second formal report.
- multiple completion submissions do not create multiple customer-facing reports unless future publication rules explicitly define versioning.
- `finalAppointmentId` remains system-owned and not customer-selectable.

## Sensitive Data Scan Assertions

Future assertions should verify:

- no real `DATABASE_URL` value.
- no access token value.
- no channel secret value.
- no email-like value.
- no Taiwan mobile-like `09xxxxxxxx`.
- no real LINE id.
- no token-looking long secret.
- no raw binary-looking value.
- forbidden markers may exist only as marker keys, not secret values.

## Current Blockers

- Task555 does not create test file.
- Task555 does not modify fixture.
- Customer-facing DTO implementation not authorized.
- Customer-facing report runtime not authorized.
- Formal FSR workflow not authorized.
- Completion persistence runtime not authorized.
- DB metadata-only inspection not approved.
- Actual applied schema unverified.
- Repository runtime not authorized.
- AI/RAG/vector DB not authorized.

## Planning Conclusion

PARTIAL - NEEDS DTO FIXTURE MARKERS FIRST

Task555 does not approve fixture modification.

Task555 does not approve test implementation.

Task555 does not approve test execution.

Task555 does not approve DTO implementation.

Task555 does not approve runtime.

Task555 does not approve DB access.

Task555 does not approve migration.

Any future fixture/test file touch requires a separate PM task with exact allowed files.

## Future Sequencing

Future tasks may include, but are not executed here:

- Task556: Customer-Facing DTO Fixture Marker Extension / No Runtime / No Test Execution.
- Task557: Customer-Facing DTO Static Contract Test / No Runtime.
- Task558: Customer Identity Access Boundary Review / No Runtime.
- Task559: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task560: PM Continuation Handoff Summary / No Runtime Change.

## Completion Checklist

- Modified files: this Task555 markdown file only.
- Docs-only: yes.
- No DTO implementation.
- No fixture modification.
- No test file creation.
- No test execution.
- No runtime approval.
- No DB command.
- No migration approval.
- Customer-facing report runtime not authorized.
- No backend `src/` change.
- No `admin/src/` change.
- No repository runtime.
- No package change.
- No provider sending.
- No AI/RAG/vector DB.
- No sensitive data copied.
