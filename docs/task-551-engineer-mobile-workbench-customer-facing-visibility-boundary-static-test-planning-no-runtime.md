# Task 551 - Engineer Mobile Workbench Customer-facing Visibility Boundary Static Test Planning

## Branch Status

Task551 is docs-only.

This task converts the Task550 customer-facing service report visibility boundary review into a future pure static test plan.

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

Future tests should prove that customer-facing service report data is a filtered customer-visible publication and not a second formal Field Service Report.

This plan defines the target future static test shape without authorizing the test file, fixture edits, runtime code, DB access, or test execution.

## Future Test File Proposal

Future test file proposal:

```text
tests/engineerMobileWorkbench/engineerMobileWorkbench.customerFacingVisibilityBoundary.static.test.js
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

## Future Test Target Fixture Groups

| Fixture group | Purpose | Key assertions | Forbidden assumptions | Existing marker status |
| --- | --- | --- | --- | --- |
| `customerVisibleReportFixtures` | Published / withheld customer-facing synthetic report projections | Published fixture uses allowed projection keys; withheld draft stays internal | Do not treat as runtime DTO | Present after Task547 |
| `customerVisibleAllowedKeys` | Explicit allow-list proposal | Required safe categories exist | Allowed key is not automatically visible | Present after Task547 |
| `customerVisibleForbiddenKeys` | Explicit forbidden customer-visible markers | Internal / raw / secret marker keys are forbidden | Marker existence is not secret value existence | Present after Task547 |
| `customerAccessScenarios` | Customer access / safe-deny scenarios | Verified, unverified, unlinked, cross-org, dispute, fee dispute, AI draft, signature exception scenarios exist | Do not implement customer identity runtime | Present after Task547 |
| `customerReportPublicationStates` | Future publication state proposal | Required states exist; `approved_internal_fsr` is not customer-visible by default | Do not add enum or DB field | Present after Task547 |
| `customerIdentityVerificationScenarios` | Identity / Case linkage boundary | Verified linked Case can view published only; unverified / unlinked / cross-org deny | Do not implement identity verification runtime | Present after Task547 |
| `customerVisibleFilteringInvariantNotes` | Visibility invariants | Filtered view not second FSR; source-data internal; follow-up not auto-close | Do not treat notes as runtime enforcement | Present after Task547 |
| `fieldServiceReports` | Formal internal FSR baseline | One formal report marker remains Case-level | Do not create second formal report | Present before Task547 |
| `completionSubmissions` | Source-data submission baseline | Completion submissions remain internal source material | Do not treat submissions as formal report | Present before Task547 |
| `safeDenyScenarios` | Generic safe-deny style baseline | Cross-org and ownership leak prevention remain explicit | Do not enumerate resources | Present before Task547 |

No future fixture change is required before the proposed static test file touch based on current Task547 markers.

If future PM changes the test scope beyond these groups, Codex must stop and request a new fixture extension task.

## Allowed-vs-forbidden Key Assertions

Future assertions should verify:

- allowed key list exists and is explicit.
- forbidden key list exists and is explicit.
- no forbidden key appears in the customer-visible allowed key list.
- published report fixture uses only allowed keys.
- unpublished draft fixture does not expose allowed output as published.
- raw source-data fields are not customer-visible.
- internal note / audit / AI raw / provider raw / billing / settlement keys are forbidden.
- raw binary keys are forbidden.
- token / secret / `DATABASE_URL` are forbidden marker only, not values.

Future tests should keep the model allow-list first.

The test should not prove customer safety by only deleting forbidden fields from raw source-data.

## Three-layer Model Assertions

Future assertions should verify:

- completion submission source-data is internal source material.
- formal Field Service Report remains Case-level formal report.
- customer-facing service report is filtered view / publication.
- customer-facing service report is not second formal FSR.
- one Case ultimately has one formal FSR.
- multiple completion submissions do not create multiple formal FSRs.
- `approved_internal_fsr` is not automatically customer-visible.
- `customer_report_published` requires explicit publication state marker.

These assertions protect the boundary:

```text
completion submission source-data
-> internal formal Field Service Report
-> customer-facing filtered publication
```

## Identity / Access Assertions

Future assertions should verify:

- verified customer can view published report marker exists.
- unverified customer safe-denies.
- customer not linked to Case safe-denies.
- customer from another organization safe-denies.
- unpublished draft safe-denies / is not visible.
- safe-deny avoids resource enumeration.
- customer identity verification marker exists.
- organization scope marker exists.

Future tests should not implement customer identity runtime.

They should only verify the synthetic fixture contract and planning markers.

## Complaint / Dispute / Follow-up Assertions

Future assertions should verify:

- complaint / low rating scenario requires follow-up marker.
- disputed service result requires human follow-up marker.
- fee dispute requires human follow-up marker.
- AI cannot suppress negative feedback marker exists.
- AI cannot auto-close complaint marker exists.
- customer-facing report does not expose internal dispute handling notes.

Future tests should not implement follow-up / escalation workflow.

They should only verify that the fixture expresses the boundary and follow-up marker expectations.

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

Allowed harmless marker examples:

- `DATABASE_URL` as a forbidden key marker.
- `token` as a forbidden key marker.
- `secret` as a forbidden key marker.

Forbidden examples:

- `DATABASE_URL=` with a real connection value.
- `access_token:` with a real value.
- `channel_secret:` with a real value.
- raw base64-like binary payloads.
- real contact data.

## Current Blockers

- Task551 does not create test file.
- Task551 does not modify fixture.
- Customer-facing report runtime not authorized.
- Formal FSR workflow not authorized.
- Completion persistence runtime not authorized.
- DB metadata-only inspection not approved.
- Actual applied schema unverified.
- Repository runtime not authorized.
- AI/RAG/vector DB not authorized.

## Planning Conclusion

READY FOR FUTURE CUSTOMER-FACING VISIBILITY STATIC TEST FILE TOUCH

Task551 does not approve fixture modification.

Task551 does not approve test implementation.

Task551 does not approve test execution.

Task551 does not approve runtime.

Task551 does not approve DB access.

Task551 does not approve migration.

Any future fixture/test file touch requires a separate PM task with exact allowed files.

## Future Sequencing

Future tasks may include, but are not executed here:

- Task552: Customer-Facing Visibility Boundary Static Test / No Runtime.
- Task553: Customer-Facing Report DTO Contract Proposal / No Runtime.
- Task554: Customer Identity Access Boundary Review / No Runtime.
- Task555: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task556: PM Continuation Handoff Summary / No Runtime Change.

## Completion Checklist

- Modified files: this Task551 markdown file only.
- Docs-only: yes.
- No backend `src/` change.
- No `admin/src/` change.
- No fixture modification.
- No test file creation.
- No test execution.
- No runtime approval.
- No DB command.
- No migration approval.
- Customer-facing report runtime not authorized.
- No repository runtime.
- No package change.
- No provider sending.
- No AI/RAG/vector DB.
- No sensitive data copied.
