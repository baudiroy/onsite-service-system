# Task 563 - Engineer Mobile Workbench Customer-facing Report Publication State Matrix

## Branch Status

Task563 is docs-only.

No publication runtime.

No customer-facing DTO implementation.

No customer identity runtime.

No repository runtime.

No completion persistence runtime.

No appointment state transition runtime.

No formal Field Service Report workflow implementation.

No fixture modification.

No test file creation.

No test execution.

No DB command.

No SQL.

No DDL.

No migration approval.

No provider sending.

No AI/RAG/vector DB.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

## Purpose

This document defines the future customer-facing report publication state matrix for the Engineer Mobile Workbench branch.

The goal is to clarify which future states are internal-only, unavailable, follow-up-only, or customer-visible after identity and Case checks.

This document does not create runtime states, enums, database columns, DTO code, repository code, tests, fixtures, API behavior, or publication workflow.

## Reference Review

References inspected:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-550-engineer-mobile-workbench-customer-facing-service-report-visibility-boundary-review-no-runtime.md`
- `docs/task-554-engineer-mobile-workbench-customer-facing-report-dto-contract-proposal-no-runtime.md`
- `docs/task-559-engineer-mobile-workbench-customer-identity-access-boundary-review-no-runtime.md`
- `docs/task-560-engineer-mobile-workbench-customer-identity-verification-static-test-planning-no-runtime.md`

Reference note:

- The PM wording referenced `task-554-engineer-mobile-workbench-customer-facing-service-report-dto-contract-proposal-no-runtime.md`.
- The actual existing file is `docs/task-554-engineer-mobile-workbench-customer-facing-report-dto-contract-proposal-no-runtime.md`.
- No file was renamed or created to compensate for the naming mismatch.

## State Definitions

### `draft_internal`

Internal-only draft or preparation state.

It may represent future report preparation, incomplete review, or internal source assembly, but it is not customer-visible.

It must not be returned as a customer-facing DTO.

### `source_data_submitted`

Engineer completion submission or source-data has been submitted.

This is still source-data, not a formal customer-facing publication.

It must not be exposed to the customer as a report.

### `needs_review`

Internal review is required before any customer-facing publication.

A future customer-safe follow-up response may be allowed, but internal review details must remain hidden.

### `approved_internal_fsr`

The internal formal Field Service Report may be approved for operations, billing, audit, or internal workflow.

This does not automatically make the customer-facing service report visible.

Customer publication requires a separate explicit future publication workflow.

### `customer_report_published`

The customer-facing service report has passed the future publication workflow.

It may be returned only after verified customer identity, Case linkage, organization scope match, and customer-visible data policy checks.

### `customer_report_withheld`

The customer-facing report is intentionally withheld.

A customer-safe unavailable or follow-up response may be returned, but internal withholding reason must not be exposed.

### `customer_follow_up_required`

Customer-safe follow-up is required.

The future customer-facing response may show limited follow-up status or next action, without exposing internal notes.

### `disputed`

The service result, fee, customer satisfaction, or related record is disputed.

Human follow-up is required.

AI may summarize or classify internally, but cannot hide, suppress, or close the dispute.

## Publication State Matrix

| State | State meaning | Source layer | Customer-visible? | Expected response | Identity requirement | Case linkage requirement | Organization scope requirement | Internal-only data risk | Complaint / dispute handling | AI allowed role | Forbidden side effects | Future runtime requirement | Current Task563 status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `draft_internal` | Internal draft only | completion submission source-data / internal preparation | no | unavailable DTO or safe-deny DTO proposal | verified identity still required before explaining availability | required before any customer-specific response | required | high: may include draft, raw source, internal note | not applicable except safe follow-up if needed | none for customer-facing output | no publication, no DTO creation, no state transition | future publication workflow needed | docs-only, no runtime |
| `source_data_submitted` | Engineer or source data submitted | completion submission source-data | no | unavailable DTO or safe-deny DTO proposal | verified identity still required before explaining availability | required before any customer-specific response | required | high: may include raw engineer input, validation snapshots, rejected client fields | not applicable except safe follow-up if needed | may later assist internal normalization only | no customer report, no formal FSR, no publication | future review / formalization workflow needed | docs-only, no runtime |
| `needs_review` | Internal review required | internal review before FSR/customer publication | no or limited | unavailable DTO or optional follow-up DTO proposal | verified identity required | required | required | high: may include supervisor notes, internal comments, AI risk flags | customer-safe follow-up allowed, internal reason hidden | may summarize review queue internally only | no auto-approval, no publication, no customer-visible internal reason | future review workflow needed | docs-only, no runtime |
| `approved_internal_fsr` | Internal FSR approved | internal formal FSR | no by default | unavailable DTO unless separately published | verified identity required | required | required | medium/high: approved internal FSR can still contain internal-only fields | complaint/dispute may withhold publication | may support internal summary only | no automatic customer publication | future publication workflow needed | docs-only, no runtime |
| `customer_report_published` | Customer-facing filtered report published | customer-facing publication | yes, filtered only | published DTO | verified customer identity required | customer must be linked to Case | organization scope must match | low only if allow-list DTO is enforced; high if raw FSR leaks | if complaint/dispute later appears, may move to follow-up/withheld in future design | may summarize customer-safe content only after filtering | no raw FSR dump, no internal field exposure, no second formal FSR | future DTO/projection/access runtime needed | docs-only, no runtime |
| `customer_report_withheld` | Customer report withheld | customer-facing publication control | no or limited | unavailable DTO or follow-up DTO proposal | verified identity required for customer-specific follow-up | required | required | high: withholding reason may be internal | human follow-up if needed, reason hidden | may assist internal reason summary only | no internal reason leak, no resource enumeration | future publication control needed | docs-only, no runtime |
| `customer_follow_up_required` | Customer-safe follow-up required | customer-facing follow-up layer | limited | follow-up DTO proposal | verified identity required | required | required | medium: follow-up notes may contain internal details | follow-up visible only as safe next action | may summarize/classify internally | no complaint auto-close, no internal note exposure | future follow-up workflow needed | docs-only, no runtime |
| `disputed` | Service result / fee / feedback disputed | internal dispute + customer-safe follow-up | limited | follow-up DTO proposal or unavailable DTO | verified identity required | required | required | high: dispute notes, supervisor notes, billing internals | human handling required; cannot auto-close | may summarize/classify but not suppress | no hidden negative feedback, no AI auto-close, no fee decision | future dispute/follow-up workflow needed | docs-only, no runtime |

## Response Behavior Rules

- `draft_internal` must not be customer-visible.
- `source_data_submitted` must not be customer-visible.
- `needs_review` must not be directly customer-visible; a customer-safe follow-up response may be allowed.
- `approved_internal_fsr` is not automatically customer-visible.
- `customer_report_published` may return a published DTO only after verified customer identity, linked Case, and organization scope match.
- `customer_report_withheld` should return unavailable / follow-up without leaking internal reason.
- `customer_follow_up_required` may return limited customer-safe follow-up.
- `disputed` should route to human follow-up and must not be auto-closed.

Publication state alone is never enough to grant access.

Identity, Case linkage, organization scope, and customer-visible data policy remain mandatory.

## DTO Mapping Proposal

### `CustomerFacingServiceReportPublishedDTO`

Allowed purpose:

- Show a filtered customer-visible report after explicit future publication and access checks.

Allowed fields summary:

- customer-safe status.
- report version.
- customer-safe Case display id.
- service date summary.
- appointment window summary.
- product summary.
- reported issue summary.
- reviewed work performed summary.
- reviewed resolution summary.
- customer-visible parts summary.
- signature status summary.
- approved photo evidence references.
- customer follow-up status.
- customer-safe support action.

Forbidden fields summary:

- internal notes, audit logs, AI raw payloads, provider payloads, billing/settlement internals, raw completion submissions, raw engineer input snapshots, internal dispute notes, channel identity internals, tokens, secrets, and raw binary data.

Safe-deny / non-enumeration requirement:

- Not applicable to the successful published DTO, but access checks must happen before creating it.

Runtime exists now:

- No.

### `CustomerFacingServiceReportUnavailableDTO`

Allowed purpose:

- Tell a verified and authorized customer that the customer-facing report is not available or requires follow-up, without exposing internal workflow details.

Allowed fields summary:

- status.
- generic reason code.
- message key.
- customer-safe next action.
- contact support flag.
- follow-up status.

Forbidden fields summary:

- internal approval status, unpublished draft existence if unsafe, internal withholding reason, audit logs, supervisor notes, and internal dispute notes.

Safe-deny / non-enumeration requirement:

- Must not reveal whether another customer, organization, Case, or report exists.

Runtime exists now:

- No.

### `CustomerFacingServiceReportSafeDenyDTO`

Allowed purpose:

- Return a generic customer-safe denial for unverified, unlinked, cross-scope, ambiguous, or inaccessible access attempts.

Allowed fields summary:

- status.
- generic message key.
- generic safe-deny reason class.
- customer-safe support action.

Forbidden fields summary:

- exact identity matching reason, Case existence, report existence, organization existence, raw channel identifiers, internal ownership details, and audit details.

Safe-deny / non-enumeration requirement:

- Must avoid resource enumeration.

Runtime exists now:

- No.

### Optional `CustomerFacingFollowUpDTO`

Allowed purpose:

- Show limited next action when follow-up is required for dispute, low rating, withheld report, or unresolved issue.

Allowed fields summary:

- generic follow-up status.
- customer-safe next action.
- support contact option.
- non-sensitive expected handling note.

Forbidden fields summary:

- internal dispute handling notes, supervisor review notes, AI confidence, internal risk flags, billing/settlement internals, and internal staff comments.

Safe-deny / non-enumeration requirement:

- Must not reveal internal escalation reason unless it is already customer-visible.

Runtime exists now:

- No.

## Forbidden Data Across All Publication States

The following must never be customer-visible in any state:

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
- `unapprovedFsrDraft`
- `rawCompletionSubmissionPayload`
- `rawEngineerInputSnapshot`
- `validationResultSnapshot` if internal
- `rejectedClientAuthorityFieldsSnapshot`
- `rawPhotoBinary`
- `rawSignatureBinary`
- token / secret / `DATABASE_URL`
- `customerChannelIdentityInternals`
- `crossOrganizationData`
- internal dispute / follow-up notes
- engineer private contact
- internal cost / margin / provider reconciliation data

Forbidden marker strings may exist in static fixture/test contexts, but real values must never be exposed in docs, logs, customer-facing DTOs, customer notifications, AI context, or API responses.

## Identity / Access Interaction

- Publication state alone is insufficient.
- Customer identity must be verified.
- Customer must be linked to Case.
- Organization scope must match.
- LINE is not global identity.
- Raw channel id cannot grant report access.
- Phone / address alone cannot grant access.
- `reporter`, `billing_contact`, and `on_site_contact_override` are not automatically customer viewer identity.
- Unverified, unlinked, or cross-organization access must safe-deny or return unavailable without enumeration.
- Customer channel identity internals must not appear in customer-facing DTOs.
- Internal identity matching reason must not be customer-visible.

## Complaint / Dispute / Feedback Handling

- Complaint, low rating, and negative feedback cannot be hidden.
- AI may summarize / classify, but cannot suppress negative feedback.
- AI cannot auto-close complaint.
- Disputed service result requires human follow-up.
- Fee dispute requires human follow-up.
- Publication can be withheld or limited while dispute is unresolved, proposal only.
- Customer-facing output must not expose internal dispute handling notes.

## Relationship to Current Fixture/Test Baseline

- Task547 and Task556 added fixture markers for customer-visible filtering and customer-facing DTO proposal shapes.
- Task548, Task552, Task557, and Task562 added pure static tests around customer-visible filtering, visibility boundary, DTO contract, and identity verification.
- Current baseline is static only.
- No customer-facing DTO implementation exists.
- No customer-facing report runtime exists.
- No DB-backed publication state exists.
- No publication enum exists.
- No publication table/column exists.
- No identity runtime exists.
- No repository runtime exists for publication reads.

## Guardrail Invariants

- One Case ultimately has one formal Field Service Report.
- Customer-facing service report is filtered view, not second formal FSR.
- Completion submissions remain source-data.
- Multiple completion submissions do not create multiple formal FSRs.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- Engineer cannot manually select `finalAppointmentId`.
- Completion submission does not mean Case completed.
- No survey / provider / billing / settlement / AI approval trigger.
- Customer-facing report must not expose internal note / audit / AI raw payload / billing settlement internals.
- Every future customer-facing read must be organization-scoped and permission-aware.
- LINE is not global identity.

## Current Blockers

- Customer-facing report runtime not authorized.
- Customer-facing DTO implementation not authorized.
- Customer identity runtime not authorized.
- Formal FSR workflow not authorized.
- Completion persistence runtime not authorized.
- Repository runtime not authorized.
- DB metadata-only inspection not approved.
- Actual applied schema unverified.
- Fixture/test implementation beyond current baseline not authorized in Task563.
- AI/RAG/vector DB not authorized.

## Matrix Conclusion

PUBLICATION STATE MATRIX COMPLETE - NO RUNTIME AUTHORIZED

Task563 does not approve publication runtime.

Task563 does not approve customer-facing DTO implementation.

Task563 does not approve customer identity runtime.

Task563 does not approve repository runtime.

Task563 does not approve DB access.

Task563 does not approve migration.

Any future runtime / fixture / test file touch requires separate PM task with exact allowed files.

## Future Sequencing

Future tasks, not authorized by this document:

- Task564: Customer-Facing Publication State Static Test Planning / No Runtime.
- Task565: Customer-Facing Publication State Fixture Extension / No Runtime / No Test Execution.
- Task566: Customer-Facing Publication State Static Test / No Runtime.
- Task567: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task568: PM Continuation Handoff Summary / No Runtime Change.
