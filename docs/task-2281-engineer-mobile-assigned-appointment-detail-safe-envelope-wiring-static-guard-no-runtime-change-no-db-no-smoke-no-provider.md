# Task2281 Engineer Mobile Assigned Appointment Detail Safe Envelope Wiring Static Guard

## Summary

Task2281 adds a static guard for the Task2280 Engineer Mobile assigned appointment detail safe envelope wiring.

This is a no-runtime-change task. It adds documentation and a text-only static test only.

## Guard Coverage

The guard verifies:

- `src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js` imports `presentEngineerMobileWorkbenchSafeEnvelope`.
- `data.appointment` is shaped through `presentEngineerMobileWorkbenchSafeEnvelope()`.
- Raw appointment/detail/read-model output is not returned directly as `data.appointment`.
- The existing top-level read-only response envelope remains represented.
- Task2280 unit test evidence remains present for success, generic deny/unavailable behavior, raw/private/internal non-exposure, and input/source immutability.
- The safe nested Workbench detail allowlist remains covered:
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

The guard also verifies Task2280 evidence covers unsafe leakage categories:

- raw Case / Appointment / Completion Report / Field Service Report
- DB/repository rows and raw SQL
- audit internals
- provider payloads
- AI/RAG/OpenAI/vector markers
- billing/settlement/payment/invoice markers
- `finalAppointmentId`
- customer fullAddress/raw phone/signature/photo/private fields
- debug/internal/token/password/secret markers

## Safety Boundary

The static guard reads source, test, and doc files as text only.
It does not import or execute runtime modules.
It does not import or execute DB, repositories, providers, routes, server/listener, env, smoke, or package code.

No runtime/source behavior changed.
No route/runtime wiring changed.
No Engineer Mobile route/API/DTO/projection/handler/mobile behavior changed.
No additional Workbench safe envelope helper runtime wiring was added beyond Task2280.
No visit-action decision helper runtime wiring was added.
No Customer Access or Repair Intake runtime behavior changed.
No DB command, SQL execution, SQL runtime construction, transaction implementation, migration, migration dry-run/apply, `DATABASE_URL`, Zeabur, or env inspection was performed.
No repository implementation behavior changed.
No audit persistence behavior changed.
No route path/mount or public/open route mounting changed.
No smoke test execution, endpoint probe, server/listener startup, shared runtime, deploy, staging/prod traffic, or `/healthz` was performed.
No provider sending behavior was added for LINE, SMS, email, app push, or webhook.
No auth/session, rate limit, payload-size/body-parser, permission model, role, or organization isolation source behavior changed.
No AI/RAG/OpenAI/vector DB behavior changed.
No admin frontend, billing, settlement, payment, invoice, package, or package-lock behavior changed.

The same 7 held historical docs remain untracked and untouched.
