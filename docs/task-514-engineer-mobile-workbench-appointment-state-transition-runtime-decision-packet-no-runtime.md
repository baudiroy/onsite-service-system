# Task 514 - Engineer Mobile Workbench Appointment State Transition Runtime Decision Packet

## Branch Status

Task514 belongs to the Engineer Mobile Workbench DB/repository design branch.

This task is docs-only and runtime-decision-packet-only.

There is no runtime, no controller / resolver / guard behavior change, no repository implementation, no service implementation, no SQL, no DB command, no DDL, no migration, no migration dry-run, no migration apply, no test file creation, no fixture file creation, no test execution, no provider sending, and no AI/RAG/vector database.

Task514 is not a runtime approval.

Task514 is not an appointment state machine approval.

Task514 is not a migration approval.

Current Engineer Mobile Workbench endpoints remain `501 Not Implemented` unless a later task explicitly changes runtime behavior.

## Reference Handling

Task514 may use prior Engineer Mobile Workbench design decisions as context, but it does not modify any reference file.

Relevant references inspected or confirmed present:

- `docs/PROJECT_GUARDRAILS.md`
- `docs/task-497-engineer-mobile-workbench-appointment-state-operation-rule-design-no-runtime-change.md`
- `docs/task-498-engineer-mobile-workbench-completion-submission-payload-validation-rule-design-no-runtime-change.md`
- `docs/task-506-engineer-mobile-workbench-appointment-repository-contract-proposal-no-runtime.md`
- `docs/task-508-engineer-mobile-workbench-repository-contract-integration-map-no-runtime.md`
- `docs/task-509-engineer-mobile-workbench-assignment-appointment-state-readiness-review-no-runtime.md`
- `docs/task-511-engineer-mobile-workbench-repository-runtime-authorization-decision-packet-no-runtime.md`
- `docs/task-512-engineer-mobile-workbench-completion-submission-source-data-migration-decision-packet-no-apply.md`
- `docs/task-513-engineer-mobile-workbench-repository-test-fixture-planning-no-runtime.md`
- `src/controllers/EngineerMobileWorkbenchController.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`
- `src/projections/EngineerMobileWorkbenchProjection.js`
- `src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js`
- `src/validators/EngineerMobileWorkbenchCompletionSubmissionValidator.js`

Task514 does not create, rename, patch, normalize, or execute those references.

## Decision Packet Purpose

This document clarifies whether arrived / started / completion-submissions should be treated as appointment state transition runtime in future tasks.

Purpose:

- distinguish operation eligibility lookup from actual mutation.
- classify `arrived`, `started`, and `completion-submissions` operations.
- decide which transitions could be considered by a future limited runtime task.
- decide which transitions must wait for schema, repository, audit, fixture, and migration decisions.
- prevent completion submission from being mistaken for Case completion or formal Field Service Report creation.

This task does not authorize implementing runtime.

## Operation Classification Matrix

| Operation | User intent | Current endpoint status | Required prior checks | Eligibility lookup needed? | State mutation implied? | DB write needed later? | Audit / evidence needed later? | Provider / survey / billing / AI trigger allowed? | Current Task514 authorization status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /tasks/:taskId/arrived` | engineer indicates arrival at assigned appointment | remains `501 Not Implemented` | auth session, engineer profile, organization scope, assignment, appointment visibility, operation eligibility | yes | yes, if future runtime approved | yes, if future runtime approved | yes | no | not authorized |
| `POST /tasks/:taskId/started` | engineer indicates work started / in progress | remains `501 Not Implemented` | auth session, engineer profile, organization scope, assignment, appointment visibility, arrived/eligible state | yes | yes, if future runtime approved | yes, if future runtime approved | yes | no | not authorized |
| `POST /tasks/:taskId/completion-submissions` | engineer submits completion source-data | remains `501 Not Implemented` | auth session, engineer profile, organization scope, assignment, appointment visibility, operation eligibility, payload validation | yes | source-data persistence only if future approved; not formal completion | yes, only after migration/source-data decision | yes | no | not authorized |

Current endpoints remain `501 Not Implemented` unless separately changed later.

Task514 does not change endpoint behavior.

## Eligibility vs Mutation Boundary

Future `AppointmentRepository` / operation eligibility lookup may read appointment or dispatch visit state.

Eligibility lookup must not mutate appointment state.

Actual `arrived` transition requires a future explicit runtime task.

Actual `started` transition requires a future explicit runtime task.

Completion submission persistence requires a future explicit runtime task.

Completion submission persistence must not automatically mutate appointment completed status unless separately approved.

Case status mutation is outside Task514.

Formal Field Service Report creation is outside Task514.

## Proposed Future State Concepts

These state concepts are proposal-only. Task514 creates no enum, lookup table, schema, or runtime transition.

| State concept | Proposal meaning | Layer | Engineer may initiate in future? | Supervisor/admin review needed? | Customer-facing visibility allowed? | Can imply formal FSR? | Migration/schema dependency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `scheduled` | appointment has planned service window | visit-level | no | no | yes, if confirmed | no | yes |
| `confirmed` | customer has confirmed appointment | visit-level | no | no | yes | no | yes |
| `assigned` | engineer is assigned | visit-level | no | sometimes for reassignment | no / limited | no | yes |
| `en_route` | engineer is on the way | visit-level | maybe later | no | yes, if product allows | no | yes |
| `arrived` | engineer arrived at service location | visit-level | yes, future candidate | sometimes for dispute | yes, summary only | no | yes |
| `in_progress` / `started` | engineer has started service work | visit-level | yes, future candidate | no / exception only | limited | no | yes |
| `completion_submitted_source` | engineer submitted source-data | source-data / visit-adjacent | yes, future candidate | likely for exceptions | no by default | no | yes / migration decision |
| `waiting_parts` | visit outcome requires parts | visit-level | maybe via result submission | maybe | yes, simplified | no | yes |
| `quote_needed` | visit outcome requires quote | visit-level | maybe via result submission | yes | yes, simplified | no | yes |
| `customer_not_available` | customer not available / no access | visit-level | yes, future candidate | sometimes | yes, simplified | no | yes |
| `cancelled` | appointment cancelled | visit-level | no / limited | maybe | yes, simplified | no | yes |
| `reassigned` | appointment reassigned to another engineer | visit-level | no | yes | no / limited | no | yes |
| `no_service_possible` | service cannot be performed | visit-level | maybe via result submission | yes | yes, simplified | no | yes |
| `hidden` / `unconfirmed` | not visible or not customer-confirmed | visit-level | no | no | no | no | yes |
| `superseded` / `duplicate appointment` | appointment replaced or duplicate | visit-level | no | yes | no / limited | no | yes |

## Allowed Future Limited Transition Candidates

These are future candidates only. Task514 does not implement them.

| Candidate | Preconditions | Required repository contracts | Required DB/schema confirmations | Required audit/evidence needs | Required tests/fixtures | Sensitive data constraints | Forbidden side effects | Remaining blockers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| arrived transition | authenticated engineer, active profile, server organization scope, assigned visible appointment, eligible state | auth boundary, engineer profile, organization scope, assignment, appointment eligibility | appointment state field, dispatch visit distinction, timestamp convention | actor, timestamp, org, appointment/visit, request id, previous/next state | positive own assignment, wrong engineer, wrong org, already arrived | no full customer PII in response or logs | no survey, provider, billing, settlement, AI approval, formal FSR, Case completion | schema inspection, repository runtime, audit plan, tests |
| started transition | arrived/eligible appointment, assignment still valid, no cancellation/reassignment | same as arrived plus operation eligibility | started/in_progress state convention, transition ordering | actor, timestamp, previous/next state, failure reason internal only | started after arrived, started before arrived denied, cancelled denied | no internal route/scheduling notes | no formal FSR, no Case completion, no provider/survey/billing/AI | schema inspection, audit plan, tests |
| completion source-data submitted marker | assignment valid, appointment eligible, payload valid, future source-data storage ready | validator, boundary, assignment, appointment, future completion submission repository | dedicated source-data table / status, idempotency policy | actor, request id, idempotency key, source-data lifecycle, evidence refs metadata | valid source-data, duplicate retry, signature exception, forbidden authority fields | metadata refs only, no raw binary, no AI/provider payload | no appointment completed status unless separately approved, no formal FSR, no finalAppointmentId selection | migration decision, repository contract, fixture plan, audit strategy |

## Forbidden Future Shortcuts

Future runtime must not:

- trust client appointment status.
- trust client `organizationId`.
- trust client `engineerProfileId`.
- trust client `finalAppointmentId`.
- mutate by `taskId` alone.
- mutate before assignment verification.
- mutate before organization scope verification.
- mutate before operation eligibility check.
- allow completion-submissions to directly create formal Field Service Report.
- allow completion-submissions to set Case completed.
- allow completion-submissions to select `finalAppointmentId`.
- allow state transition to trigger survey / provider sending / billing / settlement / AI approval.
- expose different errors that reveal appointment existence or assignment ownership.

## Case / Appointment / Field Service Report Invariants

Task514 preserves these invariants:

- engineer operations stay at appointment / dispatch visit layer.
- appointment / dispatch visit is the multi-visit layer.
- Case is the case layer.
- Field Service Report is the Case-level formal report.
- one Case can have multiple appointments / dispatch visits.
- one Case ultimately has only one formal Field Service Report.
- multiple completion submissions do not equal multiple formal Field Service Reports.
- `field_service_reports.case_id` uniqueness must not be broken.
- `finalAppointmentId` remains system-owned.
- engineer cannot manually select `finalAppointmentId`.
- completion submission does not mean Case completed.
- completion submission does not trigger survey / provider sending / billing / settlement / AI approval.

## Audit / Evidence Requirements

Future runtime should plan audit/evidence for:

- who performed arrived / started / submitted action.
- timestamp.
- organization scope.
- appointment / dispatch visit reference.
- engineer profile reference.
- request id / idempotency key.
- previous state / proposed next state.
- failure reason internal only.
- signature exception evidence metadata.
- photo / object refs metadata.
- audit retention policy future decision.

Important limits:

- no audit runtime in Task514.
- no audit table or schema decision in Task514.
- no audit log exposure to engineer/client.

## Safe-deny / Operation-denied Behavior

| Failure scenario | Internal reason proposal | External safe response style | Deny type | What must not be leaked | Future audit need |
| --- | --- | --- | --- | --- | --- |
| unauthenticated | missing auth session | generic unauthorized | generic safe-deny | resource existence | yes |
| no engineer profile | no active engineer profile linked | generic forbidden / unavailable | generic safe-deny | profile existence details | yes |
| organization mismatch | resource outside server-side organization scope | generic not found / forbidden | generic safe-deny | other organization existence | yes |
| appointment not assigned | assignment verification failed | generic unavailable | generic safe-deny | assigned engineer identity | yes |
| appointment hidden / unconfirmed | appointment not visible/actionable | generic unavailable | operation-denied | hidden reason internals | maybe |
| appointment cancelled | terminal non-actionable state | generic unavailable | operation-denied | internal cancellation reason | yes |
| appointment reassigned | old engineer no longer authorized | generic unavailable | generic safe-deny | new engineer identity | yes |
| appointment already arrived | duplicate arrived action | safe operation already handled / unavailable | operation-denied | internal state history | maybe |
| appointment not arrived but started requested | invalid transition order | safe operation denied | operation-denied | internal state machine details | yes |
| completion submitted before started | operation not eligible | safe operation denied | operation-denied | internal workflow details | yes |
| duplicate submission / retry | idempotency conflict or duplicate | safe duplicate / already received style | operation-denied | prior payload content | yes |
| forbidden client authority fields | client tried server-owned fields | validation error keys only | operation-denied | whether referenced ids exist | yes |
| Case already has formal FSR | formal report invariant blocks source-data flow or review needed | safe operation unavailable | operation-denied | formal report internals | yes |

## Runtime Readiness Assessment

| Readiness item | Status | Future task required |
| --- | --- | --- |
| auth/session runtime ready? | partial | yes |
| engineer profile repository ready? | blocked | yes, after schema inspection |
| organization scope repository ready? | blocked | yes, after schema inspection |
| assignment repository ready? | blocked | yes, after schema inspection |
| appointment repository ready? | blocked | yes, after schema inspection |
| appointment state schema known? | blocked | yes |
| dispatch visit schema known? | blocked | yes |
| audit strategy ready? | partial | yes |
| idempotency strategy ready? | partial | yes |
| fixture/test plan ready? | partial | yes, Task513 is planning only |
| migration decision ready? | partial / blocked | yes |
| provider/survey/billing isolation ready? | partial at design level | yes, runtime tests later |
| completion submission persistence ready? | blocked | yes, after migration decision |

## Runtime Authorization Conclusion

DO NOT AUTHORIZE APPOINTMENT STATE TRANSITION RUNTIME YET.

Rationale:

- repository runtime is not authorized.
- DB access is not authorized.
- appointment / dispatch visit schema is not inspected for this branch.
- audit and idempotency strategy are not implementation-ready.
- fixture/test planning is not yet implementation.
- completion submission persistence still depends on migration and repository decisions.

Task514 itself does not approve runtime.

Task514 itself does not approve DB access.

Task514 itself does not approve migration.

Task514 itself does not approve state mutation.

Task514 itself does not approve formal Field Service Report creation.

Future runtime still requires a separate PM task with exact allowed files.

## Future Sequencing

Future tasks, proposal only:

- Task515: Completion Submission Repository Contract Proposal / No Runtime.
- Task516: Schema Inspection Planning / No DB Command.
- Task517: Migration Draft Authorization Packet / No Apply.
- Task518: Synthetic Repository Fixture File Touch Plan / No Runtime.
- Task519: Appointment State Transition Limited Runtime Scope Proposal / No Runtime.

Task514 does not execute these tasks.

## Non-goals

Task514 does not:

- modify `src/`.
- modify `admin/src/`.
- add or modify `fixtures/`.
- add or modify `tests/`.
- modify routes, controllers, resolvers, guards, projections, or validators.
- add repository classes.
- add repository interfaces.
- add service classes.
- add models.
- add SQL.
- add migrations.
- modify Migration020.
- execute DB / DDL / psql / migration / dry-run / apply.
- execute test / lint / smoke / browser / API commands.
- modify `package.json` or lock files.
- call LINE / SMS / Email / App providers.
- call AI / RAG / vector DB.
- use real personal data, token, secret, or `DATABASE_URL`.
- modify inventory docs.
- implement repository runtime.
- implement appointment visibility runtime.
- implement appointment state transition runtime.
- implement completion persistence runtime.
- implement formal Field Service Report creation.
- implement survey trigger / provider sending / billing / settlement / AI approval.
- write real or suspected-real customer data to docs.

## Verification Boundary

Task514 static verification should confirm:

- `git diff --check docs/task-514-engineer-mobile-workbench-appointment-state-transition-runtime-decision-packet-no-runtime.md` passes.
- Task514 only adds or modifies the allowed markdown file.
- no `src/`, `admin/src/`, tests, fixtures, migrations, package, smoke, or runtime files are changed by Task514.
- this document explicitly states no runtime, no repository implementation, no SQL, no DB, no migration, no fixture file creation, no test file creation, no test execution, no provider, and no AI runtime.
- this document explicitly states Task514 itself does not approve runtime or state mutation.

No test, lint, smoke, browser, API, database, migration, provider, or AI command is required for Task514.
