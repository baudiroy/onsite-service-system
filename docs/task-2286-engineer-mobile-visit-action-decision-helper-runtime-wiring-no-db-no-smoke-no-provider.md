# Task2286 Engineer Mobile Visit Action Decision Helper Runtime Wiring

Status: completed

## Summary

Task2286 wires the existing pure `decideEngineerMobileVisitAction()` helper into one narrow Engineer Mobile visit-action runtime boundary:

- `src/engineerMobile/engineerMobileVisitActionCommandPlanner.js`

The selected boundary is the command planner. It already receives injected/current-path action, actor, appointment, visit result, timestamp, and request id data before application-service transition/audit writer handling.

## Runtime Wiring

`planEngineerMobileVisitActionCommand()` now builds a selected trusted decision input for `decideEngineerMobileVisitAction()`:

- `trustedContext` is derived from the existing actor object.
- `assignmentContext` is derived from the existing appointment assignment fields.
- `actionSubject` is derived from explicit appointment identity and visit-state fields only.
- raw request containers such as body, query, headers, cookies, session, provider, debug, or env fail closed.
- report-boundary markers such as completion report, field service report, final appointment, publish, approve, create, or formalize report fields fail closed.

Allowed helper decisions are adapted back into the existing command planner output shape:

- `ok`
- `allowed`
- `plannerKind`
- `action`
- `reasonCode`
- `actorId`
- `appointmentId`
- `caseId`
- `organizationId`
- `requestId`
- `transitionIntent`
- `auditIntent`

The transition intent continues to include the existing command intent kind:

- `engineer_mobile.visit_action_transition_intent`

Supported action behavior remains bounded to:

- `start_travel`
- `arrive`
- `start_work`
- `finish_work`
- `record_visit_result`

The helper normalizes those aliases to the existing canonical action names before transition handling.

## Safety Boundary

No new route path or mount was added.
No app, server, listener, shared runtime, smoke, endpoint probe, deploy, staging, production, or `/healthz` behavior was changed.
No DB command, SQL execution, SQL runtime construction, transaction implementation, migration, migration dry-run/apply, `DATABASE_URL`, Zeabur, or env inspection was performed.
No concrete repository implementation behavior was changed.
No audit persistence behavior was changed.
No provider sending behavior was added for LINE, SMS, email, app push, or webhook.
No auth/session, rate limit, payload-size/body-parser, permission model, role, or organization isolation source behavior was changed.
No AI/RAG/OpenAI/vector DB behavior was added.
No billing, settlement, payment, invoice, Customer Access, Repair Intake, admin frontend, package, or package-lock behavior was changed.

Denied, malformed, unsupported, cross-scope, not-assigned, unauthorized, invalid-state, raw-container, client-controlled identity, and report-boundary inputs fail closed without transition intent.

Raw Case, Appointment, Completion Report, Field Service Report, repository/DB rows, audit/provider/AI/RAG/billing/debug/token/password/secret fields, customer private contact/address/fullAddress/photo/signature fields, and `finalAppointmentId` are not exposed by the command planner result.

Existing command, actor, appointment, and subject inputs are not mutated.

The same 7 held historical docs remain untracked and untouched.
