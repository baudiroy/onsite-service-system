# Task1818 Engineer Mobile Visit Action Transition Patch Builder / No DB Write

Status: local runtime slice.

## Scope

Task1818 adds a pure Engineer Mobile visit action transition patch builder. It converts a sanitized `transitionIntent` from the accepted command planner / application service path into a deterministic appointment update patch object for a future injected writer.

Allowed files:

- `src/engineerMobile/engineerMobileVisitActionTransitionPatchBuilder.js`
- `tests/engineerMobile/engineerMobileVisitActionTransitionPatchBuilder.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionTransitionPatchBuilderBoundary.static.test.js`
- `docs/task-1818-engineer-mobile-visit-action-transition-patch-builder-no-db-write.md`

## Runtime Behavior

The builder exports:

- `buildEngineerMobileVisitActionTransitionPatch`
- `ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_PATCH_BUILDER_KIND`

The function is synchronous and pure. It accepts only sanitized transition intent fields: `kind`, `action`, `actorId`, `appointmentId`, `caseId`, `organizationId`, `mobileVisitStatus`, `visitResult`, and `plannedAt`, plus caller-provided `now`.

Supported `mobileVisitStatus` values:

- `traveling`
- `arrived`
- `working`
- `work_finished`
- `visit_result_recorded`

Supported `visitResult` values for `visit_result_recorded`:

- `resolved`
- `follow_up_required`
- `parts_required`
- `cannot_repair`
- `customer_unavailable`
- `cancelled_on_site`

Denied outcomes return sanitized stable `reasonCode` values only:

- `transition_intent_required`
- `appointment_id_required`
- `organization_id_required`
- `actor_id_required`
- `action_required`
- `mobile_visit_status_required`
- `unsupported_mobile_visit_status`
- `invalid_visit_result`
- `completion_report_boundary`
- `final_appointment_boundary`

## Boundary Confirmation

- No DB
- No migration
- No global mount
- No route registration
- No Express import
- No repository import
- No real persistence
- No provider sending
- No completion report creation
- No completion report approval
- No completion report publication
- No finalAppointmentId mutation
- No customer-visible publication
- Pure patch builder only

Additional non-goals:

- No SQL execution or psql.
- No controller changes.
- No `src/app.js`, `src/server.js`, or route index changes.
- No listen call.
- No smoke test.
- No LINE, SMS, email, webhook, push, AI, RAG, billing, settlement, admin UI, package, lockfile, seed, or permission table changes.
- No Completion Report, Field Service Report, customer publication, or final appointment mutation workflow.
- No staging, commit, push, cleanup, reset, stash, revert, or held historical docs changes.

## Sanitization

The builder does not expose or copy raw appointment objects, customer name, phone, address, LINE IDs, private notes, report draft fields, provider payloads, SQL or DB metadata, repository names, stack traces, Completion Report or Field Service Report data, final appointment mutation fields, or customer-visible publication fields.

The builder does not mutate the provided `transitionIntent`.
