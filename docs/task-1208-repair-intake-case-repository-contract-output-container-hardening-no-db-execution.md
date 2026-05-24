# Task1208 - Repair Intake Case Repository Contract Output Container Hardening / No DB Execution

## Status

Completed locally. Not staged.

This task hardens the Repair Intake case repository contract sanitizer so unsafe raw container keys are removed after nested unsafe content is stripped. It does not change repository failure-envelope behavior, app-service wiring, route wiring, controller wiring, DB runtime, migrations, providers, admin frontend, AI, billing, staging, or commits.

No DB connection, SQL execution, migration dry-run, migration apply, `psql`, or `db:migrate` was performed.

## Implemented / Changed Files

- `src/repairIntake/repairIntakeCaseRepositoryContract.js`
- `tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js`
- `tests/repairIntake/repairIntakeCaseRepositoryContractBoundary.static.test.js`
- `tests/repairIntake/repairIntakeCaseRepositoryContractIntegration.unit.test.js`
- `docs/task-1208-repair-intake-case-repository-contract-output-container-hardening-no-db-execution.md`

## Hardening Behavior

- Added explicit `rawDraft` and `rawPlan` unsafe container markers.
- Hardened `fieldIsUnsafe` so normalized field names beginning with `raw` are denied.
- Removed empty raw container keys from contract input/output sanitization.
- Preserved safe fields such as case id, case reference, draft id, source draft id, organization id, tenant id, request id, actor id, status, source, plan, summary, metadata, and warnings.
- Preserved existing success, invalid-input, null-result, and thrown-error behavior.
- Did not change repository failure-envelope behavior.

## Test Updates

Contract unit coverage now includes raw container removal for:

- `rawDraft`;
- `rawPlan`;
- `rawRow`;
- `rawRows`;
- generic `raw` prefixed containers.

Contract static coverage now confirms the raw container deny-list markers are present and remain within sanitizer context.

Contract integration coverage now verifies the contract-wrapped repository result no longer returns an empty `rawPlan` container after nested unsafe content is stripped.

## Verification

- `node --test tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryContractBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryContractIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepository.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryBoundary.static.test.js`
- `git diff --cached --name-only`
- `git status --short -- src/repairIntake/repairIntakeCaseRepositoryContract.js tests/repairIntake/repairIntakeCaseRepositoryContract.unit.test.js tests/repairIntake/repairIntakeCaseRepositoryContractBoundary.static.test.js tests/repairIntake/repairIntakeCaseRepositoryContractIntegration.unit.test.js docs/task-1208-repair-intake-case-repository-contract-output-container-hardening-no-db-execution.md`

## Scope Boundaries Held

- Source/runtime modified: contract only.
- DB commands executed: no.
- Migration dry-run/apply executed: no.
- Additional staging performed: no.
- Commit performed: no.
- Cleanup/reset/stash/revert performed: no.
- Existing dirty tracked legacy files touched: no.
- Unrelated untracked files touched: no.
