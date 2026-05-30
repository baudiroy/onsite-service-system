# Task2280 Engineer Mobile Workbench Safe Envelope Presenter Runtime Wiring

## Summary

Task2280 authorizes one narrow runtime wiring point for the existing pure safe Workbench envelope presenter:

- `src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js`

The selected boundary is the read-only assigned appointment detail handler output boundary, after repository scope checks and projection mapping, before the HTTP adapter returns the handler result to callers.

## Runtime Wiring

The detail handler now shapes the engineer-facing `data.appointment` payload through `presentEngineerMobileWorkbenchSafeEnvelope()`.

The outer read-only Workbench envelope remains the existing handler envelope:

- `status`
- `messageKey`
- `engineerMobileVisible`
- `data.appointment`

The nested `data.appointment` value is now the safe presenter output allowlist:

- `ok`
- `status`
- `messageKey`
- `assignmentReference`
- `caseReference`
- `appointmentReference`
- `serviceStatus`
- `appointmentWindow`
- `customerDisplay`
- `locationSummary`
- `workOrderSummary`
- `eligibility`
- `actions`

## Safety Boundary

No new route path or mount was added.
No app, server, listener, shared runtime, smoke, endpoint probe, deploy, staging, production, or `/healthz` behavior was changed.
No DB command, SQL execution, SQL runtime construction, transaction implementation, migration, migration dry-run/apply, `DATABASE_URL`, Zeabur, or env inspection was performed.
No concrete repository implementation behavior was added or changed.
No audit persistence behavior was added.
No provider sending behavior was added for LINE, SMS, email, app push, or webhook.
No auth/session, rate limit, payload-size/body-parser, permission model, role, or organization isolation source behavior was changed.
No AI/RAG/OpenAI/vector DB behavior was added.
No billing, settlement, payment, or invoice behavior was added.
No Customer Access, Repair Intake, admin frontend, package, or package-lock behavior was changed.
No runtime wiring of the visit-action decision helper is authorized by this task.

The same 7 held historical docs remain untracked and untouched.
