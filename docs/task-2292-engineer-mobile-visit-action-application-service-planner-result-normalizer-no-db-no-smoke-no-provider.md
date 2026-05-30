# Task2292 Engineer Mobile Visit Action Application Service Planner Result Normalizer

Status: completed

## Summary

Task2292 hardens the existing Engineer Mobile visit-action application service planner-result boundary:

- `src/engineerMobile/engineerMobileVisitActionApplicationService.js`

The exact boundary is after `planEngineerMobileVisitActionCommand()` returns and before the application service decides denied/allowed handling or writes transition/audit intents.

## Runtime Change

The application service now normalizes planner results before using them:

- planner result action output is limited to supported canonical `engineer_mobile.*` visit actions.
- planner reason code output is limited to known safe planner reason codes.
- allowed planner results require safe actor, appointment, organization, and transition intent fields.
- malformed allowed planner results fail closed as `malformed_planner_result`.
- malformed transition intents fail closed as `malformed_transition_intent`.
- denied and ineligible planner results remain generic and safe.
- transition writer payloads are cloned from normalized transition intent only.
- audit writer payloads are cloned from normalized audit intent only.

Allowed application-service behavior remains compatible with existing transition and audit writer expectations. Denied or malformed planner output does not call transition or audit writers.

## Safety Behavior

The application service does not pass through raw command, planner result, appointment, actor, assignment, helper, policy, transition, or audit objects wholesale.

The application service does not expose raw Case, Appointment, Completion Report, Field Service Report objects, DB/repository rows, audit internals, provider/providerPayload, AI/RAG/OpenAI/vector data, billing/settlement/payment/invoice data, debug/internal/raw SQL/token/password/secret fields, or private customer fullAddress/raw phone/signature/photo/private fields.

Report-boundary markers are stripped from normalized output and writer payloads, including:

- `completionReportId`
- `fieldServiceReportId`
- `finalAppointmentId`
- `publishReport`
- `approveReport`
- `formalizeReport`
- `createReport`

The application service still does not approve, create, publish, formalize, or expose Field Service Report or Completion Report behavior. `finalAppointmentId` remains system-owned and is not accepted or emitted.

Input command, actor, appointment, planner result, transition, and audit objects are not mutated.

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

Task2292 verification used focused and adjacent tests only:

- `node --test tests/engineerMobile/engineerMobileVisitActionApplicationServicePlannerResultNormalizer.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionApplicationService.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionCommandPlannerSafeOutputNormalizer.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionCommandPlanner.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionDecisionHelperWiring.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionCommandPlannerSafeOutputBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionTransitionPatchBuilder.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionHttpRequestNormalizer.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`
