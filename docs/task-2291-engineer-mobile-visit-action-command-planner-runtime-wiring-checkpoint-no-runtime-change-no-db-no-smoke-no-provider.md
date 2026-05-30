# Task2291 Engineer Mobile Visit Action Command Planner Runtime Wiring Checkpoint

Status: checkpoint only

## Accepted Outcomes

Task2286 wired `decideEngineerMobileVisitAction()` into `planEngineerMobileVisitActionCommand()` at one narrow runtime boundary:

- `src/engineerMobile/engineerMobileVisitActionCommandPlanner.js`

Task2287 added a text-reading static guard for command-planner decision-helper wiring.

Task2288 checkpointed the accepted decision-helper command-planner wiring and recorded that the helper has one explicit runtime consumer.

Task2289 hardened the command planner output boundary with explicit safe output normalization.

Task2290 added a text-reading static guard for the command planner safe-output boundary.

## Current Runtime Wiring Status

The visit-action decision helper has one explicit runtime consumer:

- `src/engineerMobile/engineerMobileVisitActionCommandPlanner.js`

The command planner calls the helper inside `planEngineerMobileVisitActionCommand()`. The helper call still happens after the command planner selects trusted actor context, trusted appointment assignment context, and explicit appointment identity / visit-state subject fields.

The command planner output is explicitly shaped and safe-normalized before it is returned to the application service:

- allowed output remains compatible with existing application service expectations.
- action output is limited to supported canonical `engineer_mobile.*` visit actions.
- reason code output is limited to known safe planner reason codes.
- supported action output is filtered to supported visit actions.
- transition intent output is emitted only from allowed helper decisions.
- denied and ineligible output remains generic and safe.

No route path or mount behavior changed. No DB or repository behavior changed. No audit persistence behavior changed. No provider sending changed. No smoke, server, listener, deploy, staging, production, or `/healthz` behavior changed. No package dependencies changed.

The Workbench safe envelope presenter remains wired only to the accepted assigned appointment output boundaries:

- assigned appointment detail `data.appointment`
- assigned appointments list `data.appointments[]`

No additional Workbench safe envelope presenter runtime wiring is authorized or added by this checkpoint.

## Current Safety Status

Supported visit actions remain explicit:

- `start_travel`
- `arrive`
- `start_work`
- `finish_work`
- `record_visit_result`

Transition intent is emitted only from allowed helper decisions. Malformed helper decisions fail closed as `malformed_decision`. Malformed transition intents fail closed as `malformed_transition_intent`.

Raw request containers fail closed, including body, query, header, headers, cookie, cookies, session, provider, debug, and env containers.

Raw client-provided engineer ids cannot authorize an action. Authorization remains based on trusted actor context, trusted assignment context, and already-safe appointment/action subject fields selected by the command planner.

Report-boundary protections remain in place for:

- `completionReportId`
- `fieldServiceReportId`
- `finalAppointmentId`
- `publishReport`
- `approveReport`
- `formalizeReport`
- `createReport`

The command planner and helper do not approve, create, publish, formalize, or expose Field Service Report or Completion Report behavior. `finalAppointmentId` remains system-owned and is not accepted or emitted.

Raw Case, Appointment, Completion Report, Field Service Report objects, repository rows, DB rows, audit internals, provider payloads, AI/RAG/OpenAI/vector data, billing/settlement/payment/invoice internals, debug/internal/raw SQL/token/password/secret fields, and private customer contact/address/fullAddress/photo/signature data are not exposed by the command planner output.

## Non-Authorized Candidate Tasks

These are candidates only. They are not authorized by this checkpoint. PM must still authorize one exact task with allowed files, forbidden scope, and verification commands before any work begins.

- Runtime wiring static guard for any additional boundary.
- Bounded application-service-level hardening around command planner outputs if a precise source boundary is selected.
- Pure visit-action command envelope/helper if a precise source boundary is selected.
- Engineer Mobile projection runtime hardening follow-up only if a precise source boundary is selected.
- `docs/design` update only if a new Engineer Mobile rule is introduced.

## Non-Runtime Confirmation

This task is docs-only. No runtime/source/test behavior changed.

No additional route/runtime wiring was added. No Engineer Mobile route/API/DTO/projection/handler/mobile behavior changed beyond documenting the accepted Task2286 and Task2289 state. No additional Workbench safe envelope helper runtime wiring was added. No additional visit-action decision helper runtime wiring was added.

No Customer Access or Repair Intake runtime behavior changed. No DB command, SQL execution, SQL runtime construction, transaction implementation, migration, migration dry-run/apply, `DATABASE_URL`, Zeabur, or env inspection was performed. No repository implementation behavior changed. No audit persistence behavior changed. No route path/mount or public/open route mounting changed.

No smoke test execution, endpoint probe, server/listener startup, shared runtime, deploy, staging/prod traffic, or `/healthz` was performed. No provider sending behavior was added for LINE, SMS, email, app push, or webhook. No auth/session, rate limit, payload-size/body-parser, permission model, role, or organization isolation source behavior changed.

No AI/RAG/OpenAI/vector DB behavior changed. No admin frontend, billing, settlement, payment, invoice, package, or package-lock behavior changed.

The same 7 held historical docs remain untracked and untouched.

## Verification Scope

This checkpoint is docs-only. Verification is limited to:

- `git diff --check`
- `git diff --cached --check` if staged
- `git status --short --branch`
