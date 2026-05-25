# Task 502 - Engineer Mobile Workbench DB/Repository Design Branch Entry

## Status

Engineer Mobile Workbench DB/repository design branch begins here.

Task502 is docs-only.

There is no migration, no DDL, no database command, no repository runtime, and no behavior change.

Current Engineer Mobile Workbench runtime remains skeleton-only. Current endpoints still return `501 Not Implemented`.

## Reference Notes

The PM listed several reference documents by shorthand path. The exact shorthand paths were not present, but the corresponding task-number documents with full Engineer Mobile Workbench names exist:

- `docs/task-494-engineer-mobile-workbench-engineer-identity-model-decision-packet-no-runtime-change.md`
- `docs/task-495-engineer-mobile-workbench-organization-scope-active-organization-policy-no-runtime-change.md`
- `docs/task-496-engineer-mobile-workbench-assignment-permission-rule-design-no-runtime-change.md`
- `docs/task-497-engineer-mobile-workbench-appointment-state-operation-rule-design-no-runtime-change.md`
- `docs/task-498-engineer-mobile-workbench-completion-submission-payload-validation-rule-design-no-runtime-change.md`

Task502 does not modify those files.

## Repository Design Scope

This branch only frames future repository responsibilities.

Concepts in scope:

- engineer identity repository concept.
- engineer profile to platform user linkage concept.
- organization scope lookup concept.
- assignment lookup concept.
- appointment visibility lookup concept.
- appointment operation eligibility lookup concept.
- completion submission persistence future boundary.
- Field Service Report source-data future boundary.

These are design concepts only.

## Explicit Non-runtime Boundary

Task502 does not:

- create repository classes.
- create service classes.
- add models.
- add SQL.
- add migration.
- call a database.
- connect controller, resolver, guard, projection, auth boundary, or validator runtime.
- change endpoint response behavior.
- change mobile UI behavior.

## Data Ownership / Invariant Boundary

Engineer Mobile Workbench operations remain at the appointment / dispatch visit layer.

Completion submission remains only a future Field Service Report source-data input. It is not a formal Field Service Report.

Required invariants:

- one Case ultimately has one formal Field Service Report.
- one Case may have multiple appointments / dispatch visits.
- appointment outcomes stay visit-level.
- multiple appointments must not create multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- engineers cannot manually select `finalAppointmentId`.
- completion submitted does not mean Case completed.
- completion submitted does not trigger survey.
- completion submitted does not trigger provider sending.
- completion submitted does not trigger billing / settlement.
- completion submitted does not trigger AI approval.

## Future Repository Candidates

The following are proposal-only names. Task502 does not implement them.

- `EngineerProfileRepository`
- `EngineerAssignmentRepository`
- `EngineerWorkbenchAppointmentRepository`
- `EngineerWorkbenchCompletionSubmissionRepository`
- `EngineerWorkbenchOrganizationScopeRepository`

## Repository Responsibility Matrix

| Candidate repository | Intended purpose | Input context | Organization scope requirement | Permission / assignment dependency | Allowed future read behavior | Forbidden future write behavior | Migration required later? | Audit log required later? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `EngineerProfileRepository` | Resolve engineer profile linked to platform user. | authenticated platform user context. | Must bind profile to organization scope. | Requires authenticated identity before lookup. | read active linked engineer profile metadata. | must not create profiles from mobile request alone. | likely yes if profile table/linkage is not already sufficient. | yes for profile changes, not simple scoped read by default. |
| `EngineerWorkbenchOrganizationScopeRepository` | Resolve active organization scope for engineer workbench. | authenticated platform user plus engineer profile candidate. | Must be server-side and not client-owned. | depends on profile linkage / membership policy. | read allowed workbench organization scope. | must not trust client-supplied organization authority. | maybe, depending on existing membership/profile model. | yes for scope changes or denied cross-scope attempts. |
| `EngineerAssignmentRepository` | Check whether engineer is assigned to appointment / dispatch visit. | engineer profile, organization scope, appointment reference. | appointment and assignment must belong to same organization scope. | core assignment permission dependency. | read assignment existence and status. | must not reassign appointment from engineer client. | maybe, depending on current assignment schema. | yes for assignment changes, deny events if policy requires. |
| `EngineerWorkbenchAppointmentRepository` | Read appointment list/detail and operation eligibility for assigned tasks. | engineer profile, organization scope, assignment permission result. | all reads must filter by organization scope. | requires assignment allow before detail data. | list assigned appointments, fetch authorized task detail, check state eligibility. | must not create appointments, reschedule officially, or close Case. | maybe, if current appointment schema lacks workbench fields. | yes for state-changing operations in future. |
| `EngineerWorkbenchCompletionSubmissionRepository` | Store future completion submission draft/source data. | authorized appointment operation context plus validated payload. | submission must inherit appointment / Case organization scope. | requires assignment allow and operation eligibility. | read own submitted draft/source state if authorized. | must not create formal Field Service Report or write final appointment authority. | likely yes for durable submissions/idempotency. | yes for submission, correction, duplicate, and review outcomes. |

## Query Boundary Proposal

Future query flow should stay conceptual until runtime is explicitly scoped.

Proposal-only lookup sequence:

1. lookup current engineer profile by authenticated platform user.
2. verify profile is active, linked, and within server-side organization scope.
3. list assigned appointments for current engineer only.
4. fetch appointment detail only when assigned and scoped.
5. check arrived / started eligibility by appointment state.
6. store completion submission draft/source only in a future persistence task.

No SQL is defined in Task502.

No database access is performed in Task502.

## Sensitive Data / Visibility Boundary

Engineer Mobile Workbench must not expose:

- internal note.
- audit log.
- AI raw payload.
- billing / settlement internal data.
- internal dispatch reasoning that is not needed by engineer.
- customer-facing report drafts not authorized for engineer view.
- cross-customer or cross-organization data.

Future projection should use the minimum necessary customer data for field work.

Report and analytics data minimization still applies.

Files, photos, signatures, and attachments remain future object/file storage references. Task502 does not design binary database storage.

## Completion Submission Future Boundary

Completion submission persistence is not part of Task502.

Future design must decide:

- whether completion submissions are stored as source data, draft data, or event records.
- how duplicate mobile retries are deduplicated.
- how completion submission is reviewed or promoted into formal Field Service Report workflow.
- how photo/signature/parts metadata is linked without storing raw binary in main tables.
- how audit/evidence is written without leaking sensitive payloads.

Formal Field Service Report completion remains a separate backend/system-owned workflow.

## Future Sequencing

Proposal-only future tasks:

- Task503: engineer profile repository contract proposal / no runtime.
- Task504: assignment lookup repository contract proposal / no runtime.
- Task505: completion submission persistence design / no migration.
- Task506: migration decision packet / no apply.

Task502 does not execute any of these tasks.

## Explicit Non-goals

Task502 does not:

- modify backend `src/`.
- modify `admin/src/`.
- modify routes, controllers, resolvers, guards, projections, or validators.
- add repository runtime code.
- add service runtime code.
- add tests / fixtures / smoke tests.
- execute tests.
- add or modify migration.
- modify Migration020.
- execute database / DDL / psql / migration / dry-run / apply commands.
- modify package files.
- call LINE / SMS / Email / App providers.
- call AI, RAG, or vector database.
- add file/object storage runtime design.
- modify inventory docs.
- use real personal data, token, secret, or database URL values.

## Verification Boundary

Task502 should be verified statically only:

- confirm only the allowed Task502 markdown file is added or modified.
- confirm no `src/`, `admin/src/`, tests, fixtures, migration, or package file changes are part of this task.
- confirm this document states no migration, no database, no runtime, no provider, and no AI runtime.

No test, lint, database, smoke, browser, API, provider, or AI command is required for Task502.
