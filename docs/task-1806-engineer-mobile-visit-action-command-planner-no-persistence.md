# Task1806 Engineer Mobile Visit Action Command Planner / No Persistence

Status: implemented locally.

## Scope

Task1806 adds a pure runtime command planner for Engineer Mobile visit actions. The planner wraps the accepted visit action policy registry and converts an allowed policy decision into a sanitized transition intent.

This task does not add persistence, route mounting, repositories, provider sending, Completion Report behavior, Field Service Report behavior, customer-visible publication, or final appointment mutation.

## Files

- `src/engineerMobile/engineerMobileVisitActionCommandPlanner.js`
- `tests/engineerMobile/engineerMobileVisitActionCommandPlanner.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionCommandPlannerBoundary.static.test.js`

## Runtime Behavior

The module exports:

- `planEngineerMobileVisitActionCommand`
- `ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND`

`planEngineerMobileVisitActionCommand({ action, actor, appointment, visitResult, now })` calls the accepted registry evaluator. Denied policy decisions return a sanitized denied command result and preserve safe decision fields such as action, reason code, actor id, appointment id, case id, organization id, and supported actions when present.

Allowed policy decisions return a deterministic command result with:

- `ok: true`
- `allowed: true`
- `plannerKind: 'engineer_mobile.visit_action_command_planner'`
- `action`
- `reasonCode: 'allowed'`
- `actorId`
- `appointmentId`
- `caseId`
- `organizationId`
- `transitionIntent`
- `auditIntent`

The transition intent is a non-persistent intent only. It contains safe fields for the planned mobile visit status transition:

- `kind: 'engineer_mobile.visit_action_transition_intent'`
- `action`
- `actorId`
- `appointmentId`
- `caseId`
- `organizationId`
- `mobileVisitStatus`
- `visitResult`, only when the action is `engineer_mobile.record_visit_result`
- `plannedAt`, from the caller-provided `now`

The planner maps accepted actions to these mobile visit status values:

- `engineer_mobile.start_travel` -> `traveling`
- `engineer_mobile.arrive` -> `arrived`
- `engineer_mobile.start_work` -> `working`
- `engineer_mobile.finish_work` -> `work_finished`
- `engineer_mobile.record_visit_result` -> `visit_result_recorded`

The planner does not mutate input actor or appointment objects. It does not call `Date.now()`, `new Date()`, timers, environment variables, filesystem, DB, network, Express, or global app state.

## Boundary Confirmation

- No DB
- No migration
- No SQL execution
- No psql
- No global mount
- No provider sending
- No persistence
- No repository write
- No repository changes
- No controller changes
- No route changes
- No smoke test
- No AI/RAG
- No billing/settlement
- No admin UI
- No package or lockfile changes
- No seed changes
- No completion report creation
- No completion report approval
- No completion report publication
- No Field Service Report creation
- No Field Service Report approval
- No Field Service Report publication
- No finalAppointmentId mutation
- No customer-visible publication

The planner output excludes raw appointment rows, customer phone, address, LINE IDs, customer raw data, private notes, provider payloads, stack traces, report body, report draft data, SQL, and credentials.
