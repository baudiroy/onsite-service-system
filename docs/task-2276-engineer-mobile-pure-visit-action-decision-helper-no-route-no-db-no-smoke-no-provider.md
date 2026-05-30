# Task2276 - Engineer Mobile Pure Visit Action Decision Helper

Status: implemented as pure helper only

## Scope

This task adds a pure Engineer Mobile visit-action decision helper and focused unit tests. It does not wire the helper into routes, handlers, DTOs, repositories, workflow runtime, provider paths, smoke, DB, migrations, or package files.

Added files:

- `src/engineerMobile/engineerMobileVisitActionDecisionHelper.js`
- `tests/engineerMobile/engineerMobileVisitActionDecisionHelper.unit.test.js`
- `docs/task-2276-engineer-mobile-pure-visit-action-decision-helper-no-route-no-db-no-smoke-no-provider.md`

## Helper Contract

`decideEngineerMobileVisitAction(input)` accepts a plain input object containing trusted permission context, trusted assignment context, an action name, and an already-safe action subject / appointment state.

The helper returns a new decision object and never mutates input.

Supported action aliases are:

- `start_travel`
- `arrive`
- `start_work`
- `finish_work`
- `record_visit_result`

Canonical actions remain the existing Engineer Mobile action names:

- `engineer_mobile.start_travel`
- `engineer_mobile.arrive`
- `engineer_mobile.start_work`
- `engineer_mobile.finish_work`
- `engineer_mobile.record_visit_result`

Allowed decisions contain only safe decision fields:

- `allowed`
- `status`
- `reasonCode`
- `action`
- `assignmentReference`
- `appointmentReference`
- `transitionIntent`

Deny/ineligible decisions are generic and do not expose raw internal reason details, raw subject objects, raw rows, provider payloads, report internals, debug data, or secret material.

## Guardrails

- The helper does not trust raw client-provided engineer IDs.
- The helper does not trust raw request body, query, header, cookie, session, provider, debug, or env containers.
- The helper does not trust arbitrary request body action subjects.
- The helper does not accept client-controlled organization, case, appointment, final appointment, completion report, field service report, role, permission, actor, or engineer identifiers from raw containers.
- The helper does not expose raw Case, Appointment, Completion Report, Field Service Report, repository row, DB row, audit, provider, AI/RAG, billing, debug, raw SQL, token, password, or secret fields.
- The helper does not approve, publish, formalize, or create Field Service Report or Completion Report records.
- `finalAppointmentId` remains system-owned and is not accepted from input or emitted.

## Non-Runtime Confirmation

No route/runtime wiring was added. No existing Engineer Mobile route/API/DTO/projection/handler/mobile behavior changed outside the new pure helper.

No Workbench safe envelope runtime wiring was added. No Customer Access or Repair Intake runtime behavior changed.

No DB command, SQL execution, SQL runtime construction, transaction implementation, migration, migration dry-run/apply, DATABASE_URL, Zeabur, env inspection, repository implementation behavior, audit persistence behavior, route path/mount, public/open route mounting, smoke, endpoint probe, server/listener startup, shared runtime, deploy, staging/prod traffic, provider sending, auth/session middleware, rate-limit middleware, payload-size/body-parser middleware, permission model, role expansion, organization isolation source behavior, AI/RAG/OpenAI/vector DB, admin frontend, billing, settlement, payment, invoice, or package dependency behavior changed.

The same 7 held historical docs remain untracked and untouched.

## Verification

Required verification:

- `node --test tests/engineerMobile/engineerMobileVisitActionDecisionHelper.unit.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionEligibilityStateTransition.static.test.js`
- `node --test tests/engineerMobile/engineerMobileAssignmentPermissionContextSourceBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionPolicyRegistryBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionCommandPlannerBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionTransitionPatchBuilderBoundary.static.test.js`
- Action-specific policy static tests that are obvious and relevant
- `git diff --check`
- `git diff --cached --check` if staged
- `git status --short --branch`
