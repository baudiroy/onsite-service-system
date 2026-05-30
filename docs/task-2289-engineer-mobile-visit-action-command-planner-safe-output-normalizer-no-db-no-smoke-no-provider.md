# Task2289 Engineer Mobile Visit Action Command Planner Safe Output Normalizer

Status: completed

## Summary

Task2289 hardens the existing Engineer Mobile visit-action command planner output boundary:

- `src/engineerMobile/engineerMobileVisitActionCommandPlanner.js`

The exact boundary is the command planner result construction after `decideEngineerMobileVisitAction()` returns and before `planEngineerMobileVisitActionCommand()` returns to the application service.

## Runtime Change

The command planner now normalizes and validates output at the allowed and denied result boundary:

- allowed results use only explicit safe planner fields.
- denied and ineligible results use generic safe reason codes and no transition intent.
- action output is limited to supported canonical `engineer_mobile.*` visit actions.
- reason code output is limited to known safe planner reason codes.
- supported action output is filtered to supported visit actions only.
- transition intent output is explicitly shaped from allowed helper decisions only.
- malformed allowed helper decisions fail closed as `malformed_decision`.
- malformed transition intents fail closed as `malformed_transition_intent`.

The allowed output remains compatible with existing application service expectations:

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

The explicit transition intent remains limited to:

- `kind`
- `action`
- `actorId`
- `appointmentId`
- `caseId`
- `organizationId`
- `mobileVisitStatus`
- `visitResult` for `engineer_mobile.record_visit_result` only
- `requestId`
- `plannedAt`

## Safety Behavior

The planner does not spread raw command input, raw actor, raw appointment, raw assignment, raw policy decision, or raw helper decision objects into the returned command result.

The planner does not expose raw Case, Appointment, Completion Report, Field Service Report objects, DB/repository rows, audit internals, provider payloads, AI/RAG/OpenAI/vector data, billing/settlement/payment/invoice data, debug/internal/raw SQL/token/password/secret fields, or private customer fullAddress/raw phone/signature/photo/private fields.

Report-boundary markers fail closed or are stripped from output, including:

- `completionReportId`
- `fieldServiceReportId`
- `finalAppointmentId`
- `publishReport`
- `approveReport`
- `formalizeReport`
- `createReport`

The command planner still does not approve, create, publish, formalize, or expose Field Service Report or Completion Report behavior. `finalAppointmentId` remains system-owned and is not accepted or emitted.

Input command, actor, appointment, policy, and helper objects are not mutated.

## Non-Runtime-Expansion Confirmation

No new route path or mount was added.
No app, server, listener, shared runtime, smoke, endpoint probe, deploy, staging, production, or `/healthz` behavior was changed.
No DB command, SQL execution, SQL runtime construction, transaction implementation, migration, migration dry-run/apply, `DATABASE_URL`, Zeabur, or env inspection was performed.
No repository implementation behavior was changed.
No audit persistence behavior was changed.
No provider sending behavior was added for LINE, SMS, email, app push, or webhook.
No auth/session, rate limit, payload-size/body-parser, permission model, role, or organization isolation source behavior was changed.
No AI/RAG/OpenAI/vector DB behavior was added.
No admin frontend, billing, settlement, payment, invoice, Customer Access, Repair Intake, Workbench safe envelope runtime wiring, package, or package-lock behavior was changed.

The same 7 held historical docs remain untracked and untouched.

## Verification

Task2289 verification used focused and adjacent tests only:

- `node --test tests/engineerMobile/engineerMobileVisitActionCommandPlannerSafeOutputNormalizer.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionCommandPlanner.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionDecisionHelperWiring.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionDecisionHelper.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionDecisionHelperCommandPlannerWiring.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionCommandPlannerBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionApplicationService.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionTransitionPatchBuilder.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileStartTravelActionPolicyBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileArriveActionPolicyBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileStartWorkActionPolicyBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileFinishWorkActionPolicyBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileRecordVisitResultActionPolicyBoundary.static.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`
