# Task1206 - Repair Intake Case Repository Query Deny-List Source Hardening / No DB Execution

## Status

Completed locally. Not staged.

This task applies bounded sanitizer hardening to the injected Repair Intake case repository by adding the literal `query` unsafe marker to the deny-list. It does not add DB behavior, SQL execution, imports, app-service wiring, route wiring, controller wiring, provider changes, admin changes, AI changes, billing changes, staging, or commits.

No DB connection, SQL execution, migration dry-run, migration apply, `psql`, or `db:migrate` was performed.

## Implemented / Changed Files

- `src/repairIntake/repairIntakeCaseRepository.js`
- `tests/repairIntake/repairIntakeCaseRepository.unit.test.js`
- `tests/repairIntake/repairIntakeCaseRepositoryBoundary.static.test.js`
- `docs/task-1206-repair-intake-case-repository-query-deny-list-source-hardening-no-db-execution.md`

## Hardening Behavior

- Added `query` to the unsafe field deny-list used by `sanitizeNestedValue`.
- Unsafe `query` fields are stripped from input before delegation.
- Unsafe `query` fields are stripped from dependency results before returning.
- Existing injected dependency behavior is preserved.
- Existing fail-closed behavior is preserved.
- No DB behavior, SQL behavior, imports, or runtime wiring were introduced.

## Test Updates

The unit test now verifies:

- unsafe `query` under draft is not forwarded;
- unsafe `query` under plan is not forwarded;
- unsafe top-level `query` is not forwarded;
- unsafe `query` in dependency result summary is not returned;
- existing unsafe field stripping still covers final appointment, customer, phone, address, raw, SQL, stack, and token markers.

The static boundary test now verifies:

- the literal `query` deny-list marker exists;
- the source still has no DB, repository, env, SQL statement, app, route, controller, provider, admin, AI, billing, package, or final appointment coupling markers.

## Verification

- `node --test tests/repairIntake/repairIntakeCaseRepository.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryBoundary.static.test.js`
- `git diff --cached --name-only`
- `git status --short -- src/repairIntake/repairIntakeCaseRepository.js tests/repairIntake/repairIntakeCaseRepository.unit.test.js tests/repairIntake/repairIntakeCaseRepositoryBoundary.static.test.js docs/task-1206-repair-intake-case-repository-query-deny-list-source-hardening-no-db-execution.md`

## Scope Boundaries Held

- Production source modified: yes, bounded sanitizer hardening only.
- Existing source outside Task1206 modified: no.
- DB commands executed: no.
- Additional staging performed: no.
- Commit performed: no.
- Cleanup/reset/stash/revert performed: no.
- Existing dirty tracked legacy files touched: no.
- Unrelated untracked files touched: no.
