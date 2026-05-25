# Task 564 - Engineer Mobile Workbench Customer-Facing Publication State Static Test Planning

## Branch Status

Task564 belongs to the Engineer Mobile Workbench DB/repository design branch.

Docs-only.

Static test planning only.

No customer-facing publication runtime.

No customer-facing DTO implementation.

No customer identity runtime.

No fixture modification.

No test file creation.

No test file modification.

No test execution.

No runtime.

No repository implementation.

No SQL / DB command / DDL.

No migration / dry-run / apply.

No provider sending.

No AI/RAG/vector DB.

Not a publication runtime approval.

Not a formal FSR workflow approval.

Not a fixture/test implementation approval.

Not a DB inspection approval.

Not a migration approval.

## Planning Purpose

This document converts the Task563 customer-facing publication state matrix into future pure static test planning.

It defines how a future static test should verify publication state to DTO behavior mapping.

It defines how a future static test should verify that internal states are not customer-visible.

It defines how a future static test should verify that `approved_internal_fsr` is not automatically customer-visible.

It defines how a future static test should verify that `customer_report_published` still requires identity, Case, and organization scope checks.

Task564 does not authorize adding a test, modifying fixture data, or implementing runtime.

## Reference Review

References inspected:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-563-engineer-mobile-workbench-customer-facing-report-publication-state-matrix-no-runtime.md`
- `docs/task-554-engineer-mobile-workbench-customer-facing-report-dto-contract-proposal-no-runtime.md`
- `docs/task-559-engineer-mobile-workbench-customer-identity-access-boundary-review-no-runtime.md`
- `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.customerVisibleFiltering.static.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.customerFacingVisibilityBoundary.static.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.customerFacingDtoContract.static.test.js`
- `tests/engineerMobileWorkbench/engineerMobileWorkbench.customerIdentityVerification.static.test.js`

No reference file was modified.

## Future Test File Proposal

Future test file proposal:

```text
tests/engineerMobileWorkbench/engineerMobileWorkbench.customerFacingPublicationState.static.test.js
```

The future test should:

- Use Node built-in `node:test`.
- Use Node built-in `node:assert/strict`.
- Import only `fixtures/engineerMobileWorkbench/repositorySynthetic.fixture.js`.
- Not import backend runtime.
- Not import repository / DB / controller / resolver / service.
- Not call DB / provider / AI.
- Not use real personal data.
- Not execute full suite.
- Execute only the single future test file after a separate explicit PM task authorizes it.

## Fixture Groups / Markers To Test

| Fixture group / marker | Purpose | Expected assertions | Forbidden assumptions | Existing marker status | Future fixture extension needed |
| --- | --- | --- | --- | --- | --- |
| `customerReportPublicationStates` | Defines proposal-only publication states | all eight states exist; internal states are not customer-visible; published state requires explicit workflow | do not treat as DB enum or runtime transition | present | no, for initial static test |
| `customerFacingPublicationStateDtoMapping` | Maps publication states to DTO behavior proposal | each state maps to expected published / unavailable / safe-deny / follow-up behavior | do not treat as runtime DTO factory | present | no, for initial static test |
| `customerFacingPublishedDtoProposal` | Synthetic published DTO proposal | contains allow-list customer-safe fields; notes say synthetic-only and no runtime DTO | do not treat as API response implementation | present | no |
| `customerFacingUnavailableDtoProposal` | Synthetic unavailable response proposal | customer-safe unavailable envelope; no internal workflow reason leak | do not reveal unpublished draft or internal approval state | present | no |
| `customerFacingSafeDenyDtoProposal` | Synthetic safe-deny response proposal | generic non-enumerating response; no Case/report/org existence leak | do not leak exact denial reason | present | no |
| `customerVisibleReportFixtures` | Synthetic customer-visible report projections | published fixture uses allowed keys; withheld/internal fixture remains non-visible | do not treat as customer-facing runtime report | present | no |
| `customerAccessScenarios` | Static access scenarios | verified/linked/published visible; unverified/unlinked/cross-org unavailable or safe-deny | do not infer runtime auth service exists | present | no |
| `customerIdentityPublicationAccessFixtures` | Identity-sensitive publication access mapping | states require identity, Case linkage, organization scope | do not grant access from publication state alone | present | no |
| `customerFacingDtoInvariantNotes` | DTO boundary invariants | DTO is filtered publication, not second FSR; identity and scope required | do not treat notes as runtime code | present | no |
| `customerVisibleFilteringInvariantNotes` | Customer-visible filtering invariants | source-data/internal FSR/customer publication remain distinct | do not expose internal-only data | present | no |

## Publication State Assertions

Future assertions should verify:

- `draft_internal` exists and maps to not customer-visible.
- `source_data_submitted` exists and maps to not customer-visible.
- `needs_review` exists and maps to unavailable / optional follow-up.
- `approved_internal_fsr` exists and maps to not automatically customer-visible.
- `customer_report_published` exists and maps to published DTO allowed only after identity / Case / org checks.
- `customer_report_withheld` exists and maps to unavailable / follow-up.
- `customer_follow_up_required` exists and maps to limited customer-safe follow-up.
- `disputed` exists and maps to follow-up / human handling.

## Internal State Non-visibility Assertions

Future assertions should verify:

- `draft_internal` does not expose published DTO.
- `source_data_submitted` does not expose published DTO.
- `needs_review` does not expose internal review note.
- `approved_internal_fsr` does not expose customer-facing report automatically.
- unpublished draft does not reveal internal workflow reason.
- unavailable response does not leak approval state if unsafe.
- safe-deny avoids resource enumeration.

## Published State Access Assertions

Future assertions should verify:

- published state still requires verified customer identity.
- published state still requires Case linkage.
- published state still requires organization scope match.
- published state still uses allow-list DTO fields only.
- published state does not expose forbidden internal fields.
- published state uses refs only for approved evidence, not raw binary.

## Withheld / Follow-up / Dispute Assertions

Future assertions should verify:

- `customer_report_withheld` maps to unavailable / follow-up.
- `customer_follow_up_required` maps to limited customer-safe follow-up.
- `disputed` maps to human follow-up.
- complaint / low rating cannot be hidden.
- AI cannot suppress negative feedback.
- AI cannot auto-close complaint.
- fee dispute requires human follow-up.
- internal dispute handling notes are not customer-visible.

## DTO Behavior Assertions

Future assertions should verify:

- published DTO allowed fields only.
- unavailable DTO customer-safe reason only.
- safe-deny DTO generic non-enumerating response.
- follow-up DTO proposal uses customer-safe fields only.
- no internal note / audit / AI raw / provider raw / billing / settlement.
- no token / secret / `DATABASE_URL`.
- no customer channel identity internals.
- no cross-organization data.

## Three-layer Model Assertions

Future assertions should verify:

- completion submission source-data is not directly customer-visible.
- formal Field Service Report remains Case-level formal report.
- customer-facing report is filtered publication view.
- customer-facing report is not second formal FSR.
- one Case ultimately has one formal FSR.
- multiple completion submissions do not create multiple formal FSRs.
- `finalAppointmentId` remains system-owned.

## Current Blockers

- Task564 does not create test file.
- Task564 does not modify fixture.
- Customer-facing publication runtime not authorized.
- Customer-facing DTO implementation not authorized.
- Customer identity runtime not authorized.
- Formal FSR workflow not authorized.
- Completion persistence runtime not authorized.
- DB metadata-only inspection not approved.
- Actual applied schema unverified.
- Repository runtime not authorized.
- AI/RAG/vector DB not authorized.

## Planning Conclusion

READY FOR FUTURE PUBLICATION STATE STATIC TEST FILE TOUCH

Task564 does not approve fixture modification.

Task564 does not approve test implementation.

Task564 does not approve test execution.

Task564 does not approve publication runtime.

Task564 does not approve customer-facing DTO implementation.

Task564 does not approve DB access.

Task564 does not approve migration.

Any future fixture/test file touch requires separate PM task with exact allowed files.

## Future Sequencing

Future tasks, not authorized by this document:

- Task565: Customer-Facing Publication State Static Test / No Runtime.
- Task566: Evidence/Object-Ref Metadata Static Test Planning / No Runtime.
- Task567: Customer-Facing Report Publication Runtime Authorization Packet / No Runtime.
- Task568: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task569: PM Continuation Handoff Summary / No Runtime Change.
