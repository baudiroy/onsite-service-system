# Task1794 Engineer Mobile Start-Travel Action Policy / No DB No Global Mount

## Purpose

Task1794 adds one bounded pure runtime policy for `engineer_mobile.start_travel`.

The policy only decides whether an assigned engineer may start travel for an appointment snapshot. It does not persist state, expose an API route, mount a route globally, send provider messages, or create customer-visible effects.

## Modified Files

- `src/engineerMobile/engineerMobileStartTravelActionPolicy.js`
- `tests/engineerMobile/engineerMobileStartTravelActionPolicy.unit.test.js`
- `tests/engineerMobile/engineerMobileStartTravelActionPolicyBoundary.static.test.js`
- `docs/task-1794-engineer-mobile-start-travel-action-policy-no-db-no-global-mount.md`

## Runtime Boundary

- Pure CommonJS module.
- Synchronous evaluator only.
- No DB.
- No SQL execution.
- No repository.
- No migration.
- No DDL, schema, or index changes.
- No global mount.
- No route/controller/API exposure.
- No provider sending.
- No LINE, SMS, email, webhook, or push.
- No AI/RAG.
- No billing/settlement.
- No admin UI.
- No package changes.
- No smoke/shared runtime.
- No completion report creation.
- No completion report approval.
- No completion report publication.
- No finalAppointmentId mutation.
- No customer-visible publication.

## Policy

The module exports:

- `ENGINEER_MOBILE_START_TRAVEL_ACTION`
- `ENGINEER_MOBILE_START_TRAVEL_PERMISSION`
- `evaluateEngineerMobileStartTravelAction`

Permission key:

- `engineer_mobile.visit.start_travel`

The evaluator allows only when:

- actor exists.
- appointment exists.
- actor and appointment are in the same organization.
- actor is the assigned engineer for the appointment.
- actor has `engineer_mobile.visit.start_travel`.
- appointment status is open for start travel: `scheduled` or `rescheduled`.
- appointment has not already arrived.
- appointment has not already finished.
- appointment has no terminal visit result.
- appointment does not carry completion-report boundary indicators.

Denied decisions return stable reason codes:

- `actor_required`
- `appointment_required`
- `organization_mismatch`
- `permission_required`
- `not_assigned_engineer`
- `appointment_not_open`
- `already_arrived`
- `already_finished`
- `terminal_visit_result`
- `completion_report_boundary`

## Sanitized Output

The returned decision envelope contains only safe policy metadata:

- action
- permission
- reasonCode
- subject actor id
- subject appointment id
- subject organization id
- subject appointment status
- audit intent with safe identifiers

It does not echo raw appointment rows, customer phone, address, LINE IDs, customer raw data, private notes, SQL, credentials, provider payloads, or internal stack traces.

## Tests

Unit coverage includes:

- allowed scheduled appointment.
- allowed rescheduled appointment.
- missing actor.
- missing appointment.
- organization mismatch.
- missing permission.
- actor not assigned to appointment.
- cancelled, completed, and no-show statuses.
- already arrived appointment.
- already finished appointment.
- terminal visit result.
- completion-report boundary indicators.
- common assigned engineer snapshot keys.
- sanitized output.
- input immutability.

Static boundary coverage confirms:

- policy imports nothing.
- policy does not contain forbidden DB, route, provider, AI/RAG, billing/settlement, finalAppointmentId, or mutation patterns.
- policy does not execute persistence, provider, route, or completion workflow calls.
- this document records the no-runtime-expansion boundaries.

## Verification

Run:

```bash
node --test tests/engineerMobile/engineerMobileStartTravelActionPolicy.unit.test.js
node --test tests/engineerMobile/engineerMobileStartTravelActionPolicyBoundary.static.test.js
node --test tests/engineerMobile/engineerMobileStartTravelActionPolicy.unit.test.js tests/engineerMobile/engineerMobileStartTravelActionPolicyBoundary.static.test.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileStartTravelActionPolicy.js tests/engineerMobile/engineerMobileStartTravelActionPolicy.unit.test.js tests/engineerMobile/engineerMobileStartTravelActionPolicyBoundary.static.test.js docs/task-1794-engineer-mobile-start-travel-action-policy-no-db-no-global-mount.md
```

Also run a precise credential/sensitive scan limited to the touched files.

## Current Git Boundary

The 7 held historical untracked docs remain unrelated and must not be staged, cleaned, reset, stashed, restored, removed, or committed as part of this task.
