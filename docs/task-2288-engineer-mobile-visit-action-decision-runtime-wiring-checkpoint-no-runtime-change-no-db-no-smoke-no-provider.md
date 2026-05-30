# Task2288 Engineer Mobile Visit Action Decision Runtime Wiring Checkpoint

Status: checkpoint only

## Accepted Inputs

Task2276 added `decideEngineerMobileVisitAction(input)` as a pure Engineer Mobile visit-action decision helper. The helper accepts trusted permission context, trusted assignment context, an action name, and an already-safe action subject / appointment state.

Task2277 added a text-reading static boundary guard for the pure helper. It freezes the helper export, import boundary, supported actions, safe allow shape, allowed-only transition intent, raw request-container rejection, report-boundary protection, and no-runtime/no-DB/no-provider/no-AI/no-billing dependency boundaries.

Task2278 recorded the branch checkpoint before runtime wiring. At that checkpoint, the helper remained pure and standalone with no route, handler, DTO, repository, workflow, runtime, provider path, or mobile runtime wiring.

Task2286 wired `decideEngineerMobileVisitAction()` into the narrow command planner boundary:

- `src/engineerMobile/engineerMobileVisitActionCommandPlanner.js`

Task2287 added a text-reading static guard freezing the command-planner decision-helper wiring:

- `tests/engineerMobile/engineerMobileVisitActionDecisionHelperCommandPlannerWiring.static.test.js`

## Current Runtime Wiring Status

The visit-action decision helper has one explicit runtime consumer:

- `src/engineerMobile/engineerMobileVisitActionCommandPlanner.js`

The wiring happens inside `planEngineerMobileVisitActionCommand()`. The command planner builds selected trusted decision input for `decideEngineerMobileVisitAction()` before application-service transition and audit writer handling.

Current wiring facts:

- `trustedContext` is selected from the existing actor fields.
- `assignmentContext` is selected from the existing appointment assignment fields.
- `actionSubject` is selected from explicit appointment identity and visit-state fields.
- supported visit action aliases normalize to the canonical `engineer_mobile.*` actions.
- allowed helper decisions are adapted into the existing command planner output shape.
- `transitionIntent` is emitted only from allowed helper decisions.
- denied, malformed, unsupported, cross-scope, not-assigned, unauthorized, invalid-state, raw-container, client-controlled identity, and report-boundary inputs fail closed without transition intent.

No route path or mount behavior changed. No DB or repository implementation behavior changed. No audit persistence behavior changed. No provider sending behavior changed. No smoke, server, listener, deploy, staging, production, or `/healthz` behavior changed. No package dependencies changed.

The Workbench safe envelope presenter remains wired only to the accepted assigned appointment output boundaries from earlier tasks:

- Task2280: assigned appointment detail `data.appointment` boundary in `src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js`
- Task2283: assigned appointments list `data.appointments[]` boundary in `src/engineerMobile/engineerMobileAssignedAppointmentsHandler.js`

This checkpoint does not authorize or add any additional Workbench safe envelope presenter runtime wiring.

## Current Safety Status

The command planner now calls the pure decision helper before transition and audit handling. Supported visit actions remain explicit:

- `start_travel`
- `arrive`
- `start_work`
- `finish_work`
- `record_visit_result`

Raw request containers continue to fail closed, including body, query, header, headers, cookie, cookies, session, provider, debug, and env containers.

Raw client-provided engineer ids cannot authorize an action. Authorization remains based on trusted actor context, trusted assignment context, and already-safe appointment/action subject fields selected by the command planner.

Report-boundary protections remain in place for:

- `completionReportId`
- `fieldServiceReportId`
- `finalAppointmentId`
- `publishReport`
- create/approve/publish/formalize report markers

The command planner and helper do not approve, create, publish, formalize, or expose Field Service Report or Completion Report behavior. `finalAppointmentId` remains system-owned and is not accepted as client authority or emitted as a writable report boundary.

Unsafe internal objects and fields remain outside the visit-action command result, including raw Case, Appointment, Completion Report, Field Service Report objects, repository rows, DB rows, audit internals, provider payloads, AI/RAG/OpenAI/vector data, billing/settlement/payment/invoice internals, debug/internal/raw SQL/token/password/secret fields, and private customer contact/address/fullAddress/photo/signature data.

## Non-Authorized Candidate Tasks

These are candidates only. They are not authorized by this checkpoint. PM must still authorize one exact task with allowed files, forbidden scope, and verification commands before any work begins.

- Static guard for any additional runtime wiring boundary.
- Pure visit-action command envelope/helper if a precise source boundary is selected.
- Bounded runtime wiring of the Workbench safe envelope presenter into another precise boundary only if PM selects it.
- Engineer Mobile projection runtime hardening follow-up only if a precise source boundary is selected.
- `docs/design` update only if a new Engineer Mobile rule is introduced.

## Non-Runtime Confirmation

This task is docs-only. No runtime/source/test behavior changed.

No additional route/runtime wiring was added. No Engineer Mobile route/API/DTO/projection/handler/mobile behavior changed beyond documenting the accepted Task2286 state. No additional Workbench safe envelope helper runtime wiring was added. No additional visit-action decision helper runtime wiring was added.

No Customer Access or Repair Intake runtime behavior changed. No DB command, SQL execution, SQL runtime construction, transaction implementation, migration, migration dry-run/apply, `DATABASE_URL`, Zeabur, or env inspection was performed. No repository implementation behavior changed. No audit persistence behavior changed. No route path/mount or public/open route mounting changed.

No smoke test execution, endpoint probe, server/listener startup, shared runtime, deploy, staging/prod traffic, or `/healthz` was performed. No provider sending behavior was added for LINE, SMS, email, app push, or webhook. No auth/session, rate limit, payload-size/body-parser, permission model, role, or organization isolation source behavior changed.

No AI/RAG/OpenAI/vector DB behavior changed. No admin frontend, billing, settlement, payment, invoice, package, or package-lock behavior changed.

The same 7 held historical docs remain untracked and untouched.

## Verification Scope

This checkpoint is docs-only. Verification is limited to:

- `git diff --check`
- `git diff --cached --check` if staged
- `git status --short --branch`
