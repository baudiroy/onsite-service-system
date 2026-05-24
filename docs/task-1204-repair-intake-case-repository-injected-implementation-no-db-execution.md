# Task1204 - Repair Intake Case Repository Injected Implementation / No DB Execution

## Status

Completed locally. Not staged.

This task creates the first Repair Intake case repository implementation as an injected-dependency-only adapter. It does not wire the adapter into application service, controller, route, app factory, server startup, DB runtime, migrations, providers, admin frontend, AI, billing, or smoke/shared runtime.

No DB connection, SQL execution, migration dry-run, migration apply, `psql`, or `db:migrate` was performed.

## Implemented Files

- `src/repairIntake/repairIntakeCaseRepository.js`
- `tests/repairIntake/repairIntakeCaseRepository.unit.test.js`
- `docs/task-1204-repair-intake-case-repository-injected-implementation-no-db-execution.md`

## Repository Behavior

The new module exports:

- `RepairIntakeCaseRepositoryError`
- `createRepairIntakeCaseRepository(options)`

The factory requires one injected case creation dependency with a `createCaseFromDraft(input)` method. Supported dependency slots are:

- `caseCreationPort`
- `caseService`
- `caseRepository`

The repository exposes:

- `createCaseFromDraft(input)`

The implementation validates that the input is a plain object with plain-object `draft` and `plan` members. Invalid input returns a fail-closed envelope before the injected dependency is called.

For valid input, the repository calls the injected dependency exactly once with a sanitized creation input. It preserves safe draft, plan, draft id, source draft id, organization id, tenant id, request id, actor id, metadata, and warnings. It strips unsafe raw, customer, token, credential, SQL, DB, repository, stack, LINE marker, and final appointment fields before delegation.

The result is normalized into a safe case-like envelope with safe case id, case reference, draft id, source draft id, organization id, tenant id, request id, actor id, status, summary, metadata, and warnings.

Null, non-object, thrown, or rejected dependency results return a sanitized create-failed envelope. Raw dependency objects, raw rows, credentials, SQL, customer PII, final appointment markers, and stack details are not returned.

## Case Boundary

This implementation is intentionally not a real Case writer. It does not construct a formal Case directly and does not import existing Case service or repository modules.

The adapter preserves these boundaries:

- no appointment mutation;
- no Field Service Report or formal report creation;
- no final appointment input, output, inference, or mutation;
- no customer-visible publication side effect;
- no provider sending;
- no global DB import;
- no route, controller, application service, app factory, or server wiring;
- no transaction orchestration.

## Validation Coverage

The unit test covers:

- factory rejects missing or invalid injected case creation dependency;
- invalid input fails before dependency call;
- valid input calls injected `createCaseFromDraft` exactly once;
- delegated input is sanitized;
- unsafe draft, plan, and input fields are stripped before dependency call;
- null dependency result fails closed;
- thrown dependency error is sanitized;
- safe result includes case id, case reference, draft context, organization context, tenant context, request context, actor context, metadata, and warnings;
- unsafe markers do not leak in delegated input, result, or error paths;
- source text has no forbidden imports, no global DB/env/provider/admin/AI/billing markers, and no final appointment marker.

## Verification

- `node --test tests/repairIntake/repairIntakeCaseRepository.unit.test.js`
- `git diff --cached --name-only`
- `git status --short -- src/repairIntake/repairIntakeCaseRepository.js tests/repairIntake/repairIntakeCaseRepository.unit.test.js docs/task-1204-repair-intake-case-repository-injected-implementation-no-db-execution.md`

## Scope Boundaries Held

- Production source created: yes.
- Existing source modified: no.
- Existing tests modified: no.
- Migration files modified: no.
- Package files modified: no.
- DB commands executed: no.
- Migration dry-run/apply executed: no.
- Additional staging performed: no.
- Commit performed: no.
- Cleanup/reset/stash/revert performed: no.

## Next Candidate

The next bounded task can add a static boundary guard or an integration test that composes this injected repository behind the committed case repository contract. It should still avoid real DB execution and route/app-service wiring unless PM assigns those boundaries explicitly.
