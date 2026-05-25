# Task1015 Repair Intake Draft-to-Case Pure ApplicationService Seam

## Scope

Task1015 creates a pure injected applicationService seam for Repair Intake draft-to-Case conversion.

Implemented / changed files:

- `src/repairIntake/repairIntakeDraftToCaseApplicationService.js`
- `tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js`
- `docs/task-1015-repair-intake-draft-to-case-pure-application-service-seam-no-repository-no-db.md`

This is not real DB, repository, provider, route, or runtime-server wiring.

## Factory Export

The module exports:

- `createRepairIntakeDraftToCaseApplicationService(options)`
- `RepairIntakeDraftToCaseApplicationServiceError`

## Required Ports

The factory requires injected pure/synthetic ports:

- `draftReader.getDraftForConversion(input)`
- `casePlanner.planCaseFromDraft(input)`
- `caseCreator.createCaseFromDraft(input)`
- `auditWriter.recordDraftToCaseDecision(input)`

## ApplicationService Seam Behavior

Plan flow:

- validates input is a plain object;
- sanitizes input;
- calls only `draftReader.getDraftForConversion`;
- calls only `casePlanner.planCaseFromDraft`;
- does not call `caseCreator.createCaseFromDraft`;
- does not call `auditWriter.recordDraftToCaseDecision`;
- returns a sanitized plan envelope.

Submit flow:

- validates input is a plain object;
- sanitizes input;
- calls `draftReader.getDraftForConversion`;
- calls `casePlanner.planCaseFromDraft`;
- calls `caseCreator.createCaseFromDraft`;
- calls `auditWriter.recordDraftToCaseDecision`;
- returns a sanitized submit envelope.

Invalid input behavior:

- invalid input fails closed before any port call;
- plan invalid reason is `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_INPUT_INVALID`;
- submit invalid reason is `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_INPUT_INVALID`.

Invalid port behavior:

- factory throws `RepairIntakeDraftToCaseApplicationServiceError`;
- reasonCode is `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PORTS_REQUIRED`;
- requiredActions is `['configure_draft_reader_case_planner_case_creator_audit_writer']`.

Thrown/rejected port error behavior:

- plan port failures return `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED`;
- submit port failures return `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED`;
- raw error/rejection details are not exposed.

## Sanitization Behavior

Unsafe strings/fields tested:

- SQL / `select *`
- `DATABASE_URL`
- postgres URL marker
- phone data
- address data
- customer data
- `lineUserId`
- LINE access token marker
- `finalAppointmentId`
- stack-like text
- raw rows
- DB URL fields
- token/secret markers

Unsafe data not exposed:

- raw port objects;
- raw draft rows;
- raw DB/SQL markers;
- credentials;
- phone/address/customer data;
- LINE identity/token markers;
- `finalAppointmentId`;
- stack traces;
- raw thrown/rejected error messages.

## Boundary Confirmation

Task1015 does not modify:

- `src/repairIntake/repairIntakeDraftToCaseController.js`
- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`
- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`
- `src/routes/**`
- `src/controllers/**`
- `src/repositories/**`
- `src/db/**`
- `migrations/**`
- `admin/**`
- `package.json`
- `package-lock.json`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/**`
- Task989-Task1014 docs

No repository implementation or import, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerSanitizationBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerInputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerInputShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseController.runtime-seam.unit.test.js
git diff --name-only
git diff --cached --name-only
```
