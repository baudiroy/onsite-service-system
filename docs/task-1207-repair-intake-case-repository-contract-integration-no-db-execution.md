# Task1207 - Repair Intake Case Repository Contract Integration / No DB Execution

## Status

Completed locally. Not staged.

This task adds an integration-style unit test proving the injected Repair Intake case repository can be wrapped by the committed case repository contract using only a synthetic case creation dependency. It does not modify production source, existing tests, runtime wiring, packages, migrations, providers, admin frontend, AI, billing, or smoke/shared runtime.

No DB connection, SQL execution, migration dry-run, migration apply, `psql`, or `db:migrate` was performed.

## Implemented Files

- `tests/repairIntake/repairIntakeCaseRepositoryContractIntegration.unit.test.js`
- `docs/task-1207-repair-intake-case-repository-contract-integration-no-db-execution.md`

## Integration Chain Verified

The test composes:

1. synthetic `caseCreationPort`;
2. `createRepairIntakeCaseRepository`;
3. `createRepairIntakeCaseRepositoryContract`;
4. `createCaseFromDraft`.

## Behavior Coverage

Success path:

- contract calls repository `createCaseFromDraft`;
- repository calls synthetic `caseCreationPort.createCaseFromDraft` exactly once;
- delegated input is sanitized before dependency call;
- safe draft, plan, organization, tenant, request, and actor context are preserved;
- returned case-like result is sanitized by repository and contract;
- unsafe raw dependency object, SQL, credentials, PII, LINE, final appointment, and stack markers do not leak.

Invalid input path:

- invalid contract input fails before repository call;
- synthetic dependency is not called;
- failure envelope is sanitized.

Dependency null/non-object path:

- synthetic dependency returns null;
- repository returns fail-closed status;
- contract preserves sanitized failed status and safe context;
- unsafe markers do not leak.

Dependency thrown/rejected path:

- synthetic dependency throws with unsafe markers;
- repository converts it to sanitized failed status;
- contract preserves sanitized failed status and safe context;
- stack, SQL, credentials, PII, LINE, and final appointment markers do not leak.

No DB execution:

- only synthetic dependency is used;
- no real DB import is used;
- no env usage is used.

## Residual Note

The current committed contract wraps repository failure envelopes as sanitized failed-status case-like results. This preserves safe context and prevents unsafe marker leaks, but it does not preserve repository failure `ok: false` or repository failure reason codes through the outer contract envelope. This task does not change production source, so any stricter failure-envelope preservation should be assigned as a future bounded contract hardening task.

The current committed contract also performs a shallow unsafe-name filter before invoking the repository. It strips direct top-level unsafe markers such as final appointment and authorization fields, while the Task1204/1206 repository performs the deeper recursive sanitization before the synthetic case creation dependency is called. This task verifies the external dependency input and final contract output do not leak unsafe markers. Any stricter contract-pre-repository recursive sanitization should be assigned separately.

The integration test also observed that the outer contract can preserve an empty `rawPlan` key inside the returned `plan` object after its nested sensitive contents are stripped. No SQL, token, customer, LINE, final appointment, stack, or raw dependency row content leaks through this path. A future contract hardening task can remove empty unsafe container keys from the outer plan echo if PM wants the contract envelope to be stricter.

## Verification

- `node --test tests/repairIntake/repairIntakeCaseRepositoryContractIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepositoryBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeCaseRepository.unit.test.js`
- `git diff --cached --name-only`
- `git status --short -- tests/repairIntake/repairIntakeCaseRepositoryContractIntegration.unit.test.js docs/task-1207-repair-intake-case-repository-contract-integration-no-db-execution.md src/repairIntake/repairIntakeCaseRepository.js src/repairIntake/repairIntakeCaseRepositoryContract.js`

## Scope Boundaries Held

- Production source modified: no.
- Existing tests modified: no.
- DB commands executed: no.
- Additional staging performed: no.
- Commit performed: no.
- Cleanup/reset/stash/revert performed: no.
- Existing dirty tracked legacy files touched: no.
- Unrelated untracked files touched: no.
