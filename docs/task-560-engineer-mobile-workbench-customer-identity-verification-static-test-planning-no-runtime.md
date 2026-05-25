# Task 560 - Engineer Mobile Workbench Customer Identity Verification Static Test Planning

## Branch Status

Task560 is docs-only.

This task plans a future customer identity verification static test after the Task559 customer identity access boundary review.

No customer identity runtime.

No fixture modification.

No test file creation.

No test execution.

No runtime approval.

No backend source change.

No admin source change.

No DB command.

No SQL.

No DDL.

No migration approval.

No repository runtime.

No completion persistence runtime.

No customer-facing DTO implementation.

No customer-facing report runtime.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

LINE is not global identity.

## Purpose

Future customer identity tests should prove that customer-facing report access requires verified identity, Case linkage, organization scope, publication state, and safe-deny behavior.

This task defines the planned future static test, needed fixture markers, assertions, blockers, and sequencing.

It does not authorize fixture edits or test implementation.

The current fixture has basic `customerIdentityVerificationScenarios`, but does not yet have dedicated markers for reporter / customer / billing contact / on-site contact override boundaries, channel identity types, or detailed identity safe-deny categories.

## Future Test File Proposal

Future test file proposal:

```text
tests/engineerMobileWorkbench/engineerMobileWorkbench.customerIdentityVerification.static.test.js
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

## Needed Future Customer Identity Fixture Markers

Before the proposed test can be implemented cleanly, a future fixture extension should add markers such as:

- `customerIdentityAccessFixtures`
- `customerIdentityRoleBoundaryFixtures`
- `customerChannelIdentityScopeFixtures`
- `customerCaseLinkageFixtures`
- `customerIdentitySafeDenyFixtures`
- `customerIdentityPublicationAccessFixtures`
- `customerIdentityInvariantNotes`

These names are proposal-only.

Task560 does not approve adding them.

## Customer Identity Verification Assertions

Future assertions should verify:

- verified customer identity marker exists.
- unverified customer safe-denies.
- expired / revoked identity safe-denies.
- ambiguous identity safe-denies.
- suspicious identity safe-denies.
- identity verification cannot reveal whether Case exists.
- identity verification cannot reveal whether customer phone / channel identity is correct.
- verification result is organization-scoped.
- raw channel id alone cannot grant access.

## Channel Identity Assertions

Future assertions should verify:

- LINE must not be used as global identity.
- LINE identity must be scoped by `organization_id + line_channel_id + line_user_id` in future design.
- Web / SMS / App identities must also be scoped and verified in future design.
- customer channel identity internals must not appear in customer-facing DTO.
- raw channel secret / access token must not appear in fixture values.
- customer-facing report cannot be accessed by raw channel id alone.

## Case Linkage Assertions

Future assertions should verify:

- customer must be linked to Case.
- customer not linked to Case safe-denies.
- reporter is not automatically customer.
- billing_contact is not automatically customer.
- on_site_contact_override is not automatically customer identity for report access.
- phone / address alone cannot grant report access.
- cross-customer Case access safe-denies.
- Case linkage must be organization-scoped.
- future static test must avoid assuming global Case lookup.

## Organization Scope Assertions

Future assertions should verify:

- customer identity and Case organization must match.
- cross-organization customer access safe-denies.
- no cross-organization fallback.
- no global Case lookup.
- no global customer lookup by phone / LINE id.
- no first matching Case lookup.
- unresolved organization scope fails closed.
- report exists in another organization must not leak existence.

## Publication State Access Assertions

Future assertions should verify:

- `draft_internal` is not visible.
- `source_data_submitted` is not visible.
- `needs_review` is not visible or only customer-safe follow-up.
- `approved_internal_fsr` is not automatically customer-visible.
- `customer_report_published` is visible only after identity / Case / organization checks.
- `customer_report_withheld` is unavailable / follow-up.
- `customer_follow_up_required` is limited customer-safe follow-up.
- `disputed` is follow-up / human handling.

No enum is added.

No DB field is added.

No runtime transition is added.

## Safe-deny / Unavailable Assertions

Future assertions should verify:

- unverified customer gets generic safe-deny.
- unlinked customer / Case gets generic safe-deny.
- cross-organization customer access gets generic safe-deny.
- unpublished draft is unavailable or safe-denied without leaking draft details.
- withheld report is unavailable / follow-up.
- suspicious or ambiguous identity safe-denies.
- safe-deny avoids resource enumeration.
- no organization existence leak.
- no Case existence leak.
- no report existence leak.
- no internal reason in customer-facing output.

## Forbidden Customer-facing Identity Output Assertions

Future assertions should verify that customer-facing DTO / fixture output must not include:

- raw `line_user_id`.
- `line_channel_id` as exposed identity.
- channel secret / access token.
- customer channel identity internals.
- internal identity matching reason.
- other customer identities.
- other organization references.
- internal Case ownership reason.
- audit logs.
- internal notes.
- AI raw payload.
- provider payload.
- billing / settlement internals.
- token / secret / `DATABASE_URL`.

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

- Task560 does not create test file.
- Task560 does not modify fixture.
- Customer identity runtime not authorized.
- Customer-facing DTO implementation not authorized.
- Customer-facing report runtime not authorized.
- Formal FSR workflow not authorized.
- Completion persistence runtime not authorized.
- DB metadata-only inspection not approved.
- Actual applied schema unverified.
- Repository runtime not authorized.
- AI/RAG/vector DB not authorized.

## Planning Conclusion

PARTIAL - NEEDS CUSTOMER IDENTITY FIXTURE MARKERS FIRST

Task560 does not approve fixture modification.

Task560 does not approve test implementation.

Task560 does not approve test execution.

Task560 does not approve customer identity runtime.

Task560 does not approve customer-facing DTO implementation.

Task560 does not approve runtime.

Task560 does not approve DB access.

Task560 does not approve migration.

Any future fixture/test file touch requires a separate PM task with exact allowed files.

## Future Sequencing

Future tasks may include, but are not executed here:

- Task561: Customer Identity Fixture Marker Extension / No Runtime / No Test Execution.
- Task562: Customer Identity Verification Static Test / No Runtime.
- Task563: Customer-Facing Report Publication State Matrix / No Runtime.
- Task564: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task565: PM Continuation Handoff Summary / No Runtime Change.

## Completion Checklist

- Modified files: this Task560 markdown file only.
- Docs-only: yes.
- No customer identity runtime.
- No fixture modification.
- No test file creation.
- No test execution.
- No runtime approval.
- No DB command.
- No migration approval.
- LINE is not global identity.
- No customer-facing DTO implementation.
- No customer-facing report runtime.
- No backend `src/` change.
- No `admin/src/` change.
- No repository runtime.
- No package change.
- No provider sending.
- No AI/RAG/vector DB.
- No sensitive data copied.
