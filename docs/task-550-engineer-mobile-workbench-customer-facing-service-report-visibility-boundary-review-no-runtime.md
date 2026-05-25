# Task 550 - Engineer Mobile Workbench Customer-facing Service Report Visibility Boundary Review

## Branch Status

Task550 is docs-only.

This task reviews the future customer-facing service report visibility boundary after the Task547 fixture extension and Task548 static test baseline.

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

No customer-facing DTO implementation.

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented`.

## Purpose

Customer-facing service report design must remain separate from the internal formal Field Service Report.

This review defines the visibility boundary for a future customer-facing filtered view without approving any runtime, database, API, fixture, or test changes.

The goal is to prevent future implementations from accidentally exposing internal source-data, unapproved drafts, AI raw payloads, audit records, billing / settlement internals, or cross-organization data to customers.

## Relationship Between Formal FSR and Customer-facing Report

The internal Field Service Report is the Case-level formal completion record.

The customer-facing service report is a filtered customer-visible view / publication.

It is not a second formal report.

It must only use approved customer-visible fields.

It requires verified customer identity, Case linkage, organization scope, permission-aware access policy, and explicit publication workflow.

It must not expose internal-only data.

Publication runtime remains unauthorized.

Customer-facing service report runtime remains unauthorized.

## Customer-visible Allowed Categories

Allowed customer-visible categories are proposal-only.

Future customer-facing report projection may include:

- service date / appointment window summary.
- product summary.
- reported issue summary.
- reviewed work performed summary.
- reviewed resolution summary.
- approved customer-visible parts summary.
- signature status summary.
- customer-safe signature exception summary.
- approved photo / attachment references.
- published service status.
- customer follow-up status.

Allowed does not mean automatically visible.

Future runtime must still apply:

- verified customer identity.
- Case linkage.
- organization scope.
- role / permission checks when applicable.
- publication state checks.
- customer-visible data policy.
- sensitive data redaction.
- audit log policy.

Draft/source-data fields require review before becoming customer-visible.

AI-normalized drafts remain internal unless human-confirmed and approved through a future publication workflow.

## Internal-only Forbidden Categories

The customer-facing view must never expose:

- internal note.
- audit log.
- AI raw payload.
- AI confidence score.
- provider raw payload.
- billing internal data.
- settlement internal data.
- vendor settlement rules.
- internal engineer comment.
- supervisor review note.
- unconfirmed dispatch suggestion.
- unapproved FSR draft.
- raw completion submission payload.
- raw engineer input snapshot.
- validation result snapshot if internal.
- rejected client authority fields snapshot.
- raw photo / signature binary.
- token / secret / `DATABASE_URL`.
- customer channel identity internals.
- cross-organization data.

Forbidden markers may exist in fixtures as harmless static strings, but forbidden values must never be copied into docs, tests, logs, responses, customer-facing reports, or AI context.

## Identity / Access Boundary

Customer-facing report access requires verified customer identity.

The verified customer identity must be linked to the Case.

The organization scope must match.

Cross-organization customer access must safe-deny.

Unverified customer access must safe-deny.

Customer not linked to the Case must safe-deny.

Unpublished drafts must not be exposed.

Generic safe-deny responses should avoid resource enumeration.

Safe-deny responses must not reveal:

- whether a Case exists.
- whether a customer identity is linked.
- whether another organization owns the Case.
- whether a draft report exists.
- whether an internal review is pending.

## Complaint / Dispute / Feedback Boundary

Complaint, low rating, and negative feedback must not be hidden.

AI may summarize or classify feedback, but AI cannot suppress negative feedback.

AI cannot auto-close a complaint.

Disputed service result requires human follow-up.

Fee dispute requires human follow-up.

Customer-facing report should not display internal dispute handling notes.

Follow-up / escalation remains future workflow and unauthorized.

Customer-facing status may show a customer-safe follow-up marker, but it must not expose supervisor notes, AI risk flags, internal comments, billing internals, or settlement internals.

## Relationship to Current Fixture/Test Baseline

Task547 added customer-visible fixture groups / markers:

- `customerVisibleReportFixtures`
- `customerVisibleAllowedKeys`
- `customerVisibleForbiddenKeys`
- `customerAccessScenarios`
- `customerReportPublicationStates`
- `customerIdentityVerificationScenarios`
- `customerVisibleFilteringInvariantNotes`

Task548 added customer-visible filtering static test coverage for:

- allowed keys.
- forbidden keys.
- access scenarios.
- publication states.
- visibility invariants.
- sensitive marker scanning.

This baseline is static only.

No customer-facing runtime exists.

No customer-facing DTO exists.

No DB-backed projection exists.

No customer identity access runtime exists.

No publication workflow runtime exists.

## Guardrail Invariants

- One Case ultimately has one formal Field Service Report.
- Customer-facing service report is a filtered view, not a second formal FSR.
- Completion submissions remain source-data.
- Multiple completion submissions do not create multiple formal FSRs.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- Engineer cannot manually select `finalAppointmentId`.
- Completion submission does not mean Case completed.
- Completion submission does not trigger survey / provider / billing / settlement / AI approval.
- Customer-facing report must not expose internal note / audit / AI raw payload / provider payload / billing settlement internals.
- Every future read must be organization-scoped and permission-aware.
- Customer-facing report publication must be explicit.
- `approved_internal_fsr` is not automatically customer-visible.

## Current Blockers

- Customer-facing report runtime not authorized.
- Formal FSR workflow not authorized.
- Completion persistence runtime not authorized.
- Repository runtime not authorized.
- DB metadata-only inspection not approved.
- Actual applied schema unverified.
- Customer identity runtime not implemented.
- Customer-facing DTO not implemented.
- Publication workflow not implemented.
- AI/RAG/vector DB not authorized.

## Review Conclusion

VISIBILITY BOUNDARY REVIEW COMPLETE - NO RUNTIME AUTHORIZED

Task550 does not approve customer-facing runtime.

Task550 does not approve formal FSR workflow.

Task550 does not approve repository runtime.

Task550 does not approve DB access.

Task550 does not approve migration.

Task550 does not approve fixture modification.

Task550 does not approve test file creation.

Task550 does not approve test execution.

Any future runtime / fixture / test file touch requires a separate PM task with exact allowed files.

## Future Sequencing

Future tasks may include, but are not executed here:

- Task551: Customer-Facing Visibility Boundary Static Test Planning / No Runtime.
- Task552: Customer-Facing Report DTO Contract Proposal / No Runtime.
- Task553: Customer Identity Access Boundary Review / No Runtime.
- Task554: Disposable Local DB Schema Inspection / Metadata Only / No Migration Apply, only after explicit user approval.
- Task555: PM Continuation Handoff Summary / No Runtime Change.

## Completion Checklist

- Modified files: this Task550 markdown file only.
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
- Formal FSR workflow not authorized.
- No repository runtime.
- No package change.
- No provider sending.
- No AI/RAG/vector DB.
- No sensitive data copied.
