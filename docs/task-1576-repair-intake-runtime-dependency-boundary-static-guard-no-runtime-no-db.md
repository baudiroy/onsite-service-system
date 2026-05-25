# Task1576 - Repair Intake Runtime Dependency Boundary Static Guard

## Scope

This task adds a focused static boundary guard for Repair Intake runtime dependency and composer files. It is limited to one test file and one documentation file. It does not modify source implementation, fixtures, migrations, admin files, package metadata, runtime configuration, or held historical docs.

## Files

- `tests/repairIntake/repairIntakeRuntimeDependencyBoundary.static.test.js`
- `docs/task-1576-repair-intake-runtime-dependency-boundary-static-guard-no-runtime-no-db.md`

## Source Files Guarded

- `src/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.js`
- `src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js`
- `src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js`

## Guard Coverage

The static test verifies that the guarded source files do not introduce:

- Global runtime startup markers such as `process.env`, `DATABASE_URL`, `app.listen`, `createServer`, or `node src/server.js`.
- Migration execution markers such as `npm run db:migrate`, `psql`, migration apply, or migration dry-run commands.
- Direct DB bootstrap markers such as global DB imports, `Pool`, connection creation, `knex`, `sequelize`, or `mongoose`.
- Provider sending markers such as `provider.send`, `sendSms`, `sendLine`, `sendEmail`, or `webhook`.
- Field Service Report write authority markers such as `field_service_reports` insert, update, or delete references.

`finalAppointmentId` is allowed only as a deny-list/sanitization marker inside `FORBIDDEN_INPUT_FIELDS`. The guard strips that deny-list and fails if `finalAppointmentId` appears anywhere else.

## Non-goals

- No source implementation edits.
- No DB connection.
- No migration execution or dry-run.
- No smoke test.
- No provider, LINE, SMS, email, or webhook send.
- No server/listener startup.
- No AI/RAG/vector action.
- No billing or settlement action.
- No external network action.
- No cleanup of historical untracked docs.

## Validation

Expected validation command:

`node --test tests/repairIntake/repairIntakeRuntimeDependencyBoundary.static.test.js`

Additional expected checks:

- `git diff --check`
- `git diff --cached --check`
- `git diff --name-only`

## Guardrails

- One Case has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is untouched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- A Case may have multiple appointments and dispatch visits.
- Repair Intake draft-to-Case must not bypass Case creation rules.
- Organization isolation, permission, safe-deny, audit, and SaaS entitlement boundaries remain mandatory.
