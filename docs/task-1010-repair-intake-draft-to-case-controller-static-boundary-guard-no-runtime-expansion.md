# Task1010 Repair Intake Draft-to-Case Controller Static Boundary Guard

## Scope

Task1010 adds a static boundary guard for the Task1008 controller seam.

Implemented files only:

- `tests/repairIntake/repairIntakeDraftToCaseControllerBoundary.static.test.js`
- `docs/task-1010-repair-intake-draft-to-case-controller-static-boundary-guard-no-runtime-expansion.md`

Production source was not modified.

## Static Guard Coverage

The static test reads:

- `src/repairIntake/repairIntakeDraftToCaseController.js`

It asserts that the controller source keeps:

- factory export: `createRepairIntakeDraftToCaseController`;
- custom sanitized configuration error: `RepairIntakeDraftToCaseControllerError`;
- applicationService dependency validation;
- `planDraftToCase` handler;
- `submitDraftToCase` handler;
- safe output sanitization;
- sync thrown error sanitization;
- async rejected promise sanitization;
- sanitized controller failure reason codes.

## Forbidden Runtime Coupling Markers Checked

The static test asserts the controller source does not contain:

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

## Boundary Confirmation

Task1010 does not modify:

- `src/**`
- `tests/repairIntake/repairIntakeDraftToCaseController.runtime-seam.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js`
- `migrations/**`
- `admin/**`
- `package.json`
- `package-lock.json`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/**`
- Task989-Task1009 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseControllerBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseController.runtime-seam.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleSanitizationBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleHandlerOutputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleRequestInputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
