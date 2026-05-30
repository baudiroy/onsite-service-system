# Task2277 - Engineer Mobile Visit Action Decision Helper Static Boundary Guard

Status: implemented as static guard only

## Scope

This task adds a focused static boundary guard for the Task2276 Engineer Mobile pure visit-action decision helper. It does not modify runtime/source behavior and does not wire the helper into routes, handlers, DTOs, repositories, workflow runtime, provider paths, or mobile runtime paths.

Added files:

- `tests/engineerMobile/engineerMobileVisitActionDecisionHelperBoundary.static.test.js`
- `docs/task-2277-engineer-mobile-visit-action-decision-helper-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md`

## Static Guard Coverage

The static guard reads source, test, and doc files as text only. It does not import or execute runtime, DB, repository, provider, route, server, smoke, migration, AI/RAG, billing, package, or env code.

The guard freezes these current boundaries:

- The helper exports `decideEngineerMobileVisitAction`.
- The helper imports only the existing visit-action policy registry.
- The helper has no DB, repository, provider, AI/RAG, billing, env, server, route, runtime, or smoke imports.
- Supported short action aliases remain explicit: `start_travel`, `arrive`, `start_work`, `finish_work`, and `record_visit_result`.
- Canonical `engineer_mobile.*` action aliases remain accepted only through explicit mapping.
- Transition status mapping remains explicit for all supported actions.
- Allow decision shape remains limited to safe fields: `allowed`, `status`, `reasonCode`, `action`, `assignmentReference`, `appointmentReference`, and `transitionIntent`.
- Transition intent remains absent from deny/ineligible decisions and is emitted only from the allow path.
- Generic deny/ineligible decisions remain safe and do not expose raw internal objects.
- Raw request containers are rejected before trusted context extraction.
- The helper does not read raw `source.body`, `source.query`, `source.header`, `source.cookie`, `source.session`, `source.provider`, `source.debug`, or `source.env` containers.
- Unit evidence continues to cover client-controlled identity rejection.
- Report-boundary markers such as `completionReportId`, `fieldServiceReportId`, `finalAppointmentId`, and `publishReport` remain denied in unit coverage.
- Output evidence continues to block raw Case, Appointment, Completion Report, Field Service Report, repository row, DB row, audit, provider, AI/RAG, billing, debug, raw SQL, token, password, and secret leaks.
- Report workflow behavior remains absent: no Field Service Report / Completion Report create, approve, publish, or formalize calls.
- `finalAppointmentId` remains not accepted from input and not emitted.

## Non-Runtime Confirmation

No runtime/source behavior was changed. No `src/` files were modified by this task.

No route/runtime wiring was added. No Engineer Mobile route/API/DTO/projection/handler/mobile behavior changed. No Workbench safe envelope helper runtime wiring was added. No Customer Access or Repair Intake runtime behavior changed.

No DB command, SQL execution, SQL runtime construction, transaction implementation, migration, migration dry-run/apply, DATABASE_URL, Zeabur, env inspection, repository implementation behavior, audit persistence behavior, route path/mount, public/open route mounting, smoke, endpoint probe, server/listener startup, shared runtime, deploy, staging/prod traffic, provider sending, auth/session middleware, rate-limit middleware, payload-size/body-parser middleware, permission model, role expansion, organization isolation source behavior, AI/RAG/OpenAI/vector DB, admin frontend, billing, settlement, payment, invoice, or package dependency behavior changed.

The same 7 held historical docs remain untracked and untouched.

## Verification

Required verification:

- `node --test tests/engineerMobile/engineerMobileVisitActionDecisionHelperBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionDecisionHelper.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionEligibilityStateTransition.static.test.js`
- `node --test tests/engineerMobile/engineerMobileAssignmentPermissionContextSourceBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionPolicyRegistryBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionCommandPlannerBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionTransitionPatchBuilderBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileStartTravelActionPolicyBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileArriveActionPolicyBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileStartWorkActionPolicyBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileFinishWorkActionPolicyBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileRecordVisitResultActionPolicyBoundary.static.test.js`
- `git diff --check`
- `git diff --cached --check` if staged
- `git status --short --branch`
