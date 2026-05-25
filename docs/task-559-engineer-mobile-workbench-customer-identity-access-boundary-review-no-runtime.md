# Task 559 - Engineer Mobile Workbench Customer Identity Access Boundary Review

## Branch Status

Task559 is docs-only.

This task reviews the future customer identity access boundary for customer-facing service reports and DTOs.

No customer identity runtime.

No customer-facing DTO implementation.

No customer-facing report runtime.

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

No provider sending.

No AI/RAG/vector DB.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

## Purpose

Future customer-facing report and DTO access must be gated by verified customer identity, Case linkage, organization scope, publication state, and customer-visible data policy.

This review defines the boundary without approving runtime, DB access, migration, DTO implementation, customer identity service, fixture changes, or tests.

## Customer Identity Principles

Customer identity is not global.

LINE is not global identity.

Raw `line_user_id` must not be treated as a platform-wide identity.

Future identity checks must be scoped by:

- `organization_id`.
- channel identity type.
- `line_channel_id` when LINE is used.
- internal `customer_id`.
- Case linkage.
- verification status.

Customer identity matching must fail closed when scope is unclear.

No customer-facing report access may rely on a global phone lookup, global LINE lookup, or first matching Case lookup.

## Required Access Checks

Future customer-facing report read must require:

- verified customer identity.
- customer linked to Case.
- organization scope match.
- publication state allows customer view.
- customer-visible data policy.
- permission-aware read model.
- sensitive data redaction.
- safe-deny behavior for unknown or unauthorized access.

The future access boundary should evaluate identity and scope before any customer-facing DTO is created.

## Verified Customer / Case Linkage Boundary

Future customer access should be allowed only when:

- customer identity is verified.
- customer identity is linked to the Case.
- customer belongs to the same organization scope as the Case.
- report publication state allows customer view.
- customer-visible data policy allows the requested fields.

If any condition fails, the system must return a customer-safe unavailable or safe-deny response.

The response must not reveal whether a Case exists, whether a report exists, or whether another customer / organization owns the Case.

## Organization Scope Boundary

Every future customer-facing report read must be organization-scoped.

No cross-organization fallback.

No global Case lookup.

No global customer lookup by phone / LINE id.

No first matching Case lookup.

If organization scope cannot be resolved, fail closed.

If customer identity and Case organization mismatch, safe-deny.

If report exists in another organization, do not reveal existence.

## Publication State Access Mapping

Proposal-only state mapping:

| Publication state | Access behavior |
| --- | --- |
| `draft_internal` | not visible |
| `source_data_submitted` | not visible |
| `needs_review` | not visible / optional follow-up |
| `approved_internal_fsr` | not automatically customer-visible |
| `customer_report_published` | visible only after identity / Case / organization checks |
| `customer_report_withheld` | unavailable / follow-up |
| `customer_follow_up_required` | limited customer-safe follow-up |
| `disputed` | follow-up / human handling |

No enum is added.

No DB field is added.

No runtime transition is added.

No API behavior is changed.

## Safe-deny / Unavailable Behavior

Future safe-deny / unavailable cases include:

| Category | Customer-facing response style proposal | Must not leak | Future internal audit/log need |
| --- | --- | --- | --- |
| unverified customer | generic safe-deny | Case/report existence, identity matching reason | audit identity verification failure |
| customer identity not linked to Case | generic safe-deny | Case ownership or linkage details | audit linkage failure |
| Case belongs to another organization | generic safe-deny | organization existence, cross-org ownership | audit cross-scope denial |
| report unpublished | unavailable or generic safe-deny where enumeration risk exists | unpublished draft existence, approval status | audit publication-state denial |
| report withheld | unavailable / follow-up | internal withholding reason | audit withheld status |
| Case not found / not accessible | generic safe-deny | whether Case exists | audit lookup denial |
| customer channel identity unbound | unavailable / binding-needed if safe | raw channel identity internals | audit binding state |
| suspicious / ambiguous identity | generic safe-deny | matching candidates or ambiguity reason | audit suspicious identity |
| disputed / complaint requiring human follow-up | limited customer-safe follow-up | internal dispute notes, supervisor notes | audit follow-up required |

Internal audit/log can record exact reasons in a future runtime, but customer-facing output must stay generic and safe.

## Forbidden Customer-facing Identity Output

Future customer-facing output must not include:

- raw `line_user_id`.
- `line_channel_id`.
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

## Relationship to Current Fixture/Test Baseline

- Task547 added customer-visible filtering fixture groups.
- Task548 added customer-visible filtering static test.
- Task552 added customer-facing visibility boundary static test.
- Task556 added customer-facing DTO markers.
- Task557 added customer-facing DTO static contract test.
- Current baseline is static only.
- No customer identity runtime exists.
- No customer-facing DTO runtime exists.
- No DB-backed identity check exists.

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

- Customer identity runtime not authorized.
- Customer-facing report runtime not authorized.
- Customer-facing DTO implementation not authorized.
- Formal FSR workflow not authorized.
- Completion persistence runtime not authorized.
- Repository runtime not authorized.
- DB metadata-only inspection not approved.
- Actual applied schema unverified.
- Fixture/test implementation beyond current baseline not authorized in Task559.
- AI/RAG/vector DB not authorized.

## Review Conclusion

CUSTOMER IDENTITY ACCESS BOUNDARY REVIEW COMPLETE - NO RUNTIME AUTHORIZED

Task559 does not approve customer identity runtime.

Task559 does not approve customer-facing DTO implementation.

Task559 does not approve customer-facing report runtime.

Task559 does not approve repository runtime.

Task559 does not approve DB access.

Task559 does not approve migration.

Any future runtime / fixture / test file touch requires a separate PM task with exact allowed files.

## Future Sequencing

Future tasks may include, but are not executed here:

- Task560: Customer Identity Verification Static Test Planning / No Runtime.
- Task561: Customer Identity Fixture Marker Extension / No Runtime / No Test Execution.
- Task562: Customer Identity Verification Static Test / No Runtime.
- Task563: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task564: PM Continuation Handoff Summary / No Runtime Change.

## Completion Checklist

- Modified files: this Task559 markdown file only.
- Docs-only: yes.
- No customer identity runtime.
- No customer-facing DTO implementation.
- No customer-facing report runtime.
- No runtime approval.
- No backend `src/` change.
- No `admin/src/` change.
- No fixture modification.
- No test file creation.
- No test execution.
- No DB command.
- No migration approval.
- LINE is not global identity.
- No repository runtime.
- No package change.
- No provider sending.
- No AI/RAG/vector DB.
- No sensitive data copied.
