# Task2287 Engineer Mobile Visit Action Decision Helper Command Planner Wiring Static Guard

Status: completed

## Summary

Task2287 adds a no-runtime-change static boundary guard for Task2286's visit-action decision-helper runtime wiring.

The guard file is:

- `tests/engineerMobile/engineerMobileVisitActionDecisionHelperCommandPlannerWiring.static.test.js`

It reads source, test, and doc files as text only. It does not import runtime modules and does not execute DB, repository, provider, route, server, listener, env, smoke, migration, package, AI/RAG, or billing code.

## Guard Coverage

The static guard freezes these Task2286 expectations:

- `src/engineerMobile/engineerMobileVisitActionCommandPlanner.js` imports `decideEngineerMobileVisitAction`.
- `planEngineerMobileVisitActionCommand()` calls `decideEngineerMobileVisitAction()`.
- trusted context is selected from existing actor fields.
- assignment context is selected from existing appointment assignment fields.
- action subject is selected from explicit appointment identity and visit-state fields.
- raw body, query, headers, cookies, session, provider, debug, and env containers fail closed.
- raw client-provided engineer ids do not authorize actions.
- supported action aliases still normalize to canonical `engineer_mobile.*` actions.
- allowed helper decisions are adapted into the existing command planner output shape.
- transition intent is emitted only from allowed helper decisions.
- deny and ineligible decisions stay safe and do not expose raw objects or internals.

The guard also verifies report-boundary protections remain visible for `completionReportId`, `fieldServiceReportId`, `finalAppointmentId`, `publishReport`, and create/approve/publish/formalize report markers. Those markers remain denied, not emitted, and not used to approve or create Field Service Report or Completion Report behavior.

Unsafe leakage marker evidence remains covered for raw Case, Appointment, Completion Report, Field Service Report, repository/DB rows, audit internals, provider payloads, AI/RAG/OpenAI/vector data, billing/settlement/payment/invoice internals, debug/internal/raw SQL/token/password/secret fields, and customer fullAddress/raw phone/signature/photo/private fields.

## Non-Runtime Confirmation

No runtime/source behavior changed.
No route/runtime wiring changed.
No Engineer Mobile route/API/DTO/projection/handler/mobile behavior changed.
No Workbench safe envelope helper runtime wiring changed.
No additional visit-action decision helper runtime wiring was added beyond Task2286.
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
