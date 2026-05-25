# Task 497 - Engineer Mobile Workbench Appointment State Operation Rule Design

## Status

Task497 is docs-only.

It defines future appointment state operation rules for Engineer Mobile Workbench. It does not implement runtime behavior, tests, fixtures, database access, repository access, mobile UI, provider sending, AI, RAG, upload, signature, or persistence.

Current Engineer Mobile Workbench runtime remains skeleton-only. Existing endpoints still return `501 Not Implemented`.

## Current Baseline

Task457 defined status transition and completion submission boundaries.

Task478 added a completion submission boundary skeleton with no persistence and no state mutation.

Task496 defined assignment permission rules.

Task497 narrows the next layer: once an engineer is authenticated, scoped to an organization, and allowed by assignment permission, which appointment state operations may be considered in future runtime.

Task497 does not authorize actual state operation runtime.

## State Operation Layering

Appointment state operations belong to the appointment / dispatch visit layer.

They must not directly mutate:

- Case completion.
- Formal Field Service Report completion.
- Billing / settlement approval.
- Customer-facing report publication.
- Survey trigger.
- Provider sending.
- AI approval.

Engineer Mobile Workbench may provide field facts and evidence. Formal workflow transitions remain controlled by backend business logic, dispatcher / admin / supervisor review, customer confirmation, finance review, or deterministic rules depending on the operation.

## Recommended Future Appointment Operation Set

Future Engineer Mobile Workbench should keep the engineer operation set small and field-oriented.

Recommended operation categories:

- `arrive`: engineer arrived at the scheduled service location.
- `start_work`: engineer started on-site service work.
- `submit_completion`: engineer submits field completion input.
- `submit_unable_to_complete`: engineer reports unable-to-complete outcome.
- `submit_pending_parts`: engineer reports parts are needed before completion.
- `submit_customer_unavailable`: engineer reports customer / on-site contact unavailable.
- `submit_reschedule_requested`: engineer reports a field condition requiring reschedule review.
- `submit_cancellation_signal`: engineer reports a cancellation signal for dispatcher review.

These names are future design examples, not current API names.

## Operation Preconditions

Future runtime should evaluate at least these preconditions before any appointment operation:

- authenticated engineer session exists.
- engineer actor is active and not disabled / suspended.
- active organization scope exists.
- assignment permission allows the target appointment / dispatch visit.
- target appointment belongs to the same organization scope.
- target appointment is assigned to the engineer actor.
- target appointment is in an allowed non-terminal state.
- requested operation is valid for the current state.
- request does not attempt to send client-owned engineer or organization authority.
- request does not attempt to send or override `finalAppointmentId`.
- request does not attempt to mutate Case, formal Field Service Report, billing, settlement, survey, or provider sending directly.

These preconditions should be checked server-side. Client hidden fields or route parameters are not authority.

## Allowed Transition Recommendations

Future state transition rules should be explicit and conservative.

Proposal-only examples:

| Current state | Operation | Future target state / result | Boundary |
| --- | --- | --- | --- |
| scheduled / confirmed | arrive | arrived | Does not start work automatically. |
| arrived | start_work | in_service / started | Does not imply completion. |
| in_service / started | submit_completion | completion_submitted / completed visit candidate | Does not complete formal Field Service Report by itself. |
| scheduled / confirmed / arrived / started | submit_customer_unavailable | customer_unavailable / no-show style visit outcome | Case remains open for follow-up. |
| arrived / started | submit_pending_parts | pending_parts | Case remains open and may need next appointment. |
| arrived / started | submit_unable_to_complete | unable_to_complete | May require review or follow-up. |
| scheduled / confirmed / arrived / started | submit_reschedule_requested | reschedule_requested signal | Dispatcher/admin must decide official reschedule. |
| scheduled / confirmed / arrived / started | submit_cancellation_signal | cancellation_requested signal | Dispatcher/admin must decide official cancellation. |

The exact state names must follow existing appointment lifecycle constants when future runtime is authorized.

## Invalid Transition Recommendations

Future runtime should reject invalid transitions safely.

Examples:

- `start_work` before `arrive`, if policy requires arrival first.
- `submit_completion` when appointment is already terminal.
- `submit_completion` when appointment is assigned to another engineer.
- `submit_completion` for another organization.
- `submit_pending_parts` after formal completion.
- `submit_customer_unavailable` after work completion.
- any operation on an appointment already cancelled, no-show, completed, pending follow-up, or otherwise terminal according to lifecycle policy.
- any operation that tries to include `finalAppointmentId`.
- any operation that tries to create or close a Case.
- any operation that tries to create a second formal Field Service Report.

Invalid operations should not leak whether the appointment, Case, customer, or assignment exists.

## Appointment / Dispatch Visit Boundary

Engineer state operations must remain per-visit.

Design principles:

- One Case can have multiple appointments / dispatch visits.
- One Case should not have multiple unfinished or open appointments at the same time.
- New appointment creation belongs to dispatcher/admin or a future explicit workflow, not the normal engineer mobile flow.
- Pending parts, customer unavailable, unable to complete, reschedule requested, and cancellation signal belong to the appointment / dispatch visit layer.
- These outcomes should not create multiple formal Field Service Reports.
- These outcomes should not weaken `field_service_reports.case_id` uniqueness.

Engineer Mobile Workbench should make field reporting easier without turning field state operations into dispatch authority.

## Completion Submitted Boundary

`submit_completion` is an engineer field submission.

It is not:

- formal Field Service Report completion.
- Case completion.
- billing / settlement approval.
- customer confirmation.
- customer-facing report generation.
- survey trigger.
- provider notification sending.
- AI approval.
- manual `finalAppointmentId` selection.

Completion submission may become a source for Field Service Report draft data or review data in future runtime.

Formal completion still requires backend/system validation, stable `finalAppointmentId` resolution, one Case / one formal Field Service Report invariant, and existing repeat-completion hardening.

## `finalAppointmentId` Boundary

Engineer Mobile Workbench must not ask engineers to choose `finalAppointmentId`.

Future completion submission may reference the current appointment context internally, but authority remains backend/system-owned.

Design principles:

- Engineers do not manually select final appointment in normal flow.
- The system resolves final appointment from eligible completed appointment data.
- Admin override, if ever allowed, is a separate exception path with permission, reason, audit, and bounded scope.
- Engineer state operations must not become a hidden final appointment override.

## Exception And Review Boundary

Future runtime should support exception outcomes without treating them as formal completion.

Examples:

- no signature.
- refused signature.
- representative signature.
- remote completion.
- disputed completion.
- later low score or complaint.
- parts unavailable.
- customer unavailable.
- unsafe site / access issue.
- mismatch between engineer report and dispatch data.

These cases may route to future review queue, follow-up, customer service escalation, supervisor review, re-dispatch evaluation, quote flow, pending parts tracking, or complaint handling.

Task497 does not implement review queue runtime.

AI may later summarize or classify exceptions, but it must not automatically close complaints, approve formal results, approve billing, or override human review.

## Safe-deny / Non-enumeration Behavior

Future state operation runtime should fail safely.

Cases requiring safe-deny include:

- unauthenticated request.
- inactive engineer actor.
- missing organization scope.
- missing assignment permission.
- cross-organization request.
- appointment not found.
- appointment assigned to another engineer.
- appointment already terminal.
- invalid transition.
- malformed operation payload.

External errors should avoid resource enumeration.

Responses should not reveal:

- whether appointment exists.
- whether Case exists.
- whether customer exists.
- whether appointment belongs to another engineer.
- whether appointment belongs to another organization.
- internal transition details that help enumerate resources.
- database error details or stack traces.

Response equivalence should be a future test requirement.

## Audit / Evidence Boundary

Future runtime should audit important state operations, but Task497 does not implement audit runtime.

Potential audit / evidence fields:

- operation type.
- appointment reference.
- Case reference, if authorized and minimal.
- organization scope.
- engineer actor reference.
- previous state.
- requested operation.
- resulting state or deny result.
- timestamp.
- reason, when required.
- safe summary.
- evidence metadata references, when future file storage exists.

Audit records must avoid unnecessary sensitive payloads and must not store provider credentials, raw channel identifiers, complete customer contact details, or AI raw sensitive content.

## Future DB / Repository Implications

Future state operation runtime may require:

- appointment repository.
- appointment transition service.
- engineer assignment lookup.
- organization scope validation.
- transaction boundary.
- concurrency guard.
- terminal-state guard.
- Field Service Report draft/source handoff.
- audit/evidence runtime.
- idempotency handling for duplicate mobile submissions.

Any DB, repository, transaction, migration, or runtime work requires future PM exact scope.

Task497 does not create tables, add repositories, query a database, or modify Migration020.

## Future Verification Needs

Proposal-only future tests:

- valid transition tests.
- invalid transition tests.
- already terminal deny tests.
- cross-organization deny tests.
- assigned-to-other-engineer deny tests.
- duplicate submission idempotency tests.
- no duplicate formal Field Service Report tests.
- `finalAppointmentId` system-owned tests.
- no provider sending tests.
- no AI auto-approval tests.
- no Case mutation tests.
- safe-deny response equivalence tests.
- completion submitted does not trigger survey tests.

Task497 does not create or execute tests.

## Future Task498 Recommendation

Proposal only:

`Task498 - Engineer Mobile Workbench Completion Submission Payload Validation Rule Design / No Runtime Change`

Reason:

- Task497 defines when an appointment state operation may be allowed.
- The next safety layer should define what completion submission payload may contain.
- Payload rules should define required fields, conditionally required fields, forbidden fields, photo/signature/parts metadata boundaries, and low-burden engineer UX.

Task497 does not authorize Task498 implementation.

## Explicit Non-goals

Task497 does not:

- modify backend `src/`.
- modify `admin/src/`.
- add or modify routes, controllers, resolvers, guards, projections, auth boundaries, services, or repositories.
- add appointment state runtime.
- add actual auth/session validation.
- add real permission decision.
- add assignment lookup runtime.
- add organization scope runtime.
- query a database.
- add schema / migration / index changes.
- modify Migration020.
- add fixtures / tests.
- execute tests.
- execute DB / migration / psql commands.
- execute smoke / browser / API tests.
- implement mobile UI / PWA.
- implement upload / signature / object storage.
- trigger LINE / SMS / Email / App sending.
- call AI, RAG, or vector database.
- modify package files.
- modify inventory docs.

## Completion Checklist

Task497 completion should confirm:

- modified files.
- whether the task is docs-only.
- appointment state operation recommendation summary.
- no backend `src/` change.
- no `admin/src/` change.
- no runtime code change.
- no tests / fixtures change.
- no test execution.
- no DB / migration / Migration020 change.
- verification results.
- whether current runtime remains skeleton-only.
