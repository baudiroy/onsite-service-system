# Task1808 Engineer Mobile Visit Action Application Service / Injected Writers Only No DB No Route

Status: implemented locally.

## Scope

Task1808 adds the first bounded Engineer Mobile visit action application service. The service uses the accepted command planner and injected writer functions only.

This task does not add DB access, route mounting, controllers, repositories, real persistence, provider sending, Completion Report behavior, Field Service Report behavior, customer-visible publication, or final appointment mutation.

## Files

- `src/engineerMobile/engineerMobileVisitActionApplicationService.js`
- `tests/engineerMobile/engineerMobileVisitActionApplicationService.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionApplicationServiceBoundary.static.test.js`

## Runtime Behavior

The module exports:

- `createEngineerMobileVisitActionApplicationService`
- `ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND`

The service factory accepts injected dependencies only:

- `transitionWriter`
- `auditWriter`

The created service exposes:

- `handleEngineerMobileVisitAction({ action, actor, appointment, visitResult, now })`

The service calls `planEngineerMobileVisitActionCommand`. When the planner denies, it returns a sanitized denial and calls no writers.

When the planner allows:

- `transitionWriter.write(transitionIntent)` is required and called once.
- `auditWriter.record(auditIntent)` is called once only when provided.
- The audit writer is never called before the transition writer.
- Writer thrown errors or failed writer results are converted to stable sanitized reason codes.

Stable service reason codes include:

- `transition_writer_required`
- `transition_write_failed`
- `audit_write_failed`
- `applied`

The service result is sanitized. It includes safe IDs, action, service kind, transition status, audit status, and safe planner intents only. It does not expose raw writer errors, stack traces, SQL, DB details, provider payloads, raw appointment rows, customer phone, address, LINE IDs, customer raw data, private notes, report draft fields, or customer-visible publication fields.

The service does not mutate input actor, appointment, transitionIntent, or auditIntent values. It does not call `Date.now()`, `new Date()`, timers, environment variables, filesystem, DB, network, Express, or global app state.

## Boundary Confirmation

- No DB
- No migration
- No SQL execution
- No psql
- No global mount
- No route
- No controller
- No provider sending
- Injected writers only
- No real persistence
- No repository import
- No repository changes
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

Synthetic writers are used only in tests to prove call order, sanitized payloads, missing writer handling, writer failure handling, and audit partial failure handling.
