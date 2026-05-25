# Task1016 Repair Intake Draft-to-Case ApplicationService Static Boundary Guard

## Scope

Task1016 adds a static boundary guard for the Task1015 pure applicationService seam.

Implemented files only:

- `tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js`
- `docs/task-1016-repair-intake-draft-to-case-application-service-static-boundary-guard-no-repository-no-db.md`

Production source was not modified.

## Static Guard Coverage

The static test reads:

- `src/repairIntake/repairIntakeDraftToCaseApplicationService.js`

It asserts seam concepts for:

- factory export: `createRepairIntakeDraftToCaseApplicationService`;
- custom sanitized configuration error: `RepairIntakeDraftToCaseApplicationServiceError`;
- required ports:
  - `draftReader.getDraftForConversion`
  - `casePlanner.planCaseFromDraft`
  - `caseCreator.createCaseFromDraft`
  - `auditWriter.recordDraftToCaseDecision`
- plan flow;
- submit flow;
- plain object input validation;
- input sanitization before ports;
- output sanitization after ports;
- sync thrown error sanitization;
- async rejected promise sanitization;
- sanitized input, port, plan, and submit failure reasonCodes.

## Forbidden Runtime/Repository Coupling Markers Checked

The static test asserts the applicationService source does not contain:

- `require('../db')`
- `require('../repositories')`
- `require('../routes')`
- `require('../controllers')`
- `express()`
- `app.listen`
- `server.listen`
- `fetch(`
- `axios`
- `process.env`
- `DATABASE_URL`
- `lineAccessToken`
- `lineUserId`
- `finalAppointmentId`
- `INSERT INTO`
- `UPDATE `
- `DELETE FROM`
- `SELECT `
- `new DraftRepository`
- `new CaseRepository`
- `Pool(`
- `pg`
- `knex`
- `sequelize`
- `mongoose`

## Boundary Confirmation

Task1016 does not modify:

- `src/**`
- `tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js`
- `migrations/**`
- `admin/**`
- `package.json`
- `package-lock.json`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/**`
- Task989-Task1015 docs

No repository implementation or import, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerSanitizationBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerInputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerInputShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js
git diff --name-only
git diff --cached --name-only
```
