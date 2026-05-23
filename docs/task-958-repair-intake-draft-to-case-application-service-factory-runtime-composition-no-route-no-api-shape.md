# Task958 Repair Intake Draft-to-Case Application Service Factory

## Scope

Task958 adds a bounded production application-service factory:

- `src/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.js`
- `tests/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.unit.test.js`

This is runtime source, not API wiring. It composes accepted Repair Intake draft-to-Case modules into an injectable application service while staying before route/controller/OpenAPI exposure.

## Composition

`createRepairIntakeDraftCaseApplicationService(options)` composes:

- Task957 `createRepairIntakeDraftCaseRuntimeDependencies`
- Task937 `createRepairIntakeDraftCasePlanningService`
- Task938-Task945 `createRepairIntakeDraftCaseSubmissionService`

The returned service exposes:

- `planDraftToCase(input)`
- `submitDraftToCase(input)`

## Required Injections

The factory requires injected:

- `dbClient`
- `idGenerator`
- `draftReader`

It accepts optional:

- `clock`
- `tableNames`
- `commandGuard`
- `eligibilityEvaluator`
- `candidateBuilder`
- `auditEventBuilder`

The factory does not create a default DB client, default ID generator, or default draft reader. It does not register global dependencies.

## Behavior Boundary

Factory creation only composes dependency objects and functions. It does not call `draftReader`, does not call DB methods, does not run transactions, does not create a Case, does not link a draft, does not write audit records, and does not check idempotency at factory creation time.

`planDraftToCase(input)` delegates to the injected planning flow and uses the injected `draftReader` with sanitized lookup input.

`submitDraftToCase(input)` delegates to the accepted submission flow using the composed planner, Task957 idempotency checker, and Task957 case creator. Any DB-backed work happens only when this explicit method is called with injected dependencies.

The service preserves the Task945 internal submission envelope shape and returns no raw DB rows, SQL text, stack traces, tokens, secrets, raw phone/address/customer payload, provider payload, LINE token, or `finalAppointmentId`.

## Out of Scope

- Public route/controller/DTO/OpenAPI changes
- DB execution outside explicit method calls with injected dependencies
- psql, SQL dry-run, DDL apply, `npm run db:migrate`
- Migration creation/apply
- Smoke/shared runtime changes
- Provider sending / LINE / SMS / App / email / webhook
- AI/RAG/vector/provider runtime
- Admin frontend
- Billing/settlement/payment/invoice
- Default/global runtime registration
- Default global DB client / default ID generator / default draft reader
- Task902
- Engineer Mobile Task921-Task933

Accepted Task921-Task957 files remain local / uncommitted / untracked and must not be cleaned, reverted, relocated, or restaged by this task.

## Verification

Task958 amendment note:

- The full repairIntake suite was initially blocked by the Task948 static inventory regex because `repairIntakeDraftCaseApplicationServiceFactory.js` matches the broad `repairIntakeDraftCase*.js` pattern.
- The Task958 source filename remains unchanged.
- The Task948 static inventory was amended only to distinguish Task934-Task945 no-DB submission modules from later repository/audit/store/runtime-composition/application-service modules.
- No production behavior changed.

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.js tests/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.unit.test.js docs/task-958-repair-intake-draft-to-case-application-service-factory-runtime-composition-no-route-no-api-shape.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.js tests/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.unit.test.js docs/task-958-repair-intake-draft-to-case-application-service-factory-runtime-composition-no-route-no-api-shape.md
git status --short
```
