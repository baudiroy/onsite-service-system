# Task1578 - Repair Intake Idempotency Repository Fake-Client Unit Test Plan

## Scope

This is a docs-only planning task for a future no-DB behavior test around `src/repairIntake/repairIntakeIdempotencyRepository.js`. It does not edit source code, test code, fixtures, migrations, admin files, package metadata, runtime configuration, or held historical docs.

## Current Baseline

- Latest commit expected: `a56424a Add repair intake runtime dependency static guard`.
- Static runtime dependency boundary guard exists and passes:
  `tests/repairIntake/repairIntakeRuntimeDependencyBoundary.static.test.js`.
- Tracked worktree is expected to be clean except this new Task1578 doc when created.
- The staged area is expected to remain empty.
- The 7 held historical docs remain untracked and held.

## Target Module

- `src/repairIntake/repairIntakeIdempotencyRepository.js`

## Future Test File Candidate

- Likely existing or new: `tests/repairIntake/repairIntakeIdempotencyRepository.unit.test.js`

Before any future edit, Codex must inspect whether the test file already exists and preserve existing coverage patterns. Current read-only inventory shows that this file is already tracked, so a future bounded implementation task should prefer a minimal targeted addition to the existing file unless PM directs otherwise.

## Future Test Plan

The future task should use only a fake injected `dbClient` with a `query` method. It must not use a real DB, `psql`, migration execution, environment variables, app/server/listen startup, smoke tests, provider sending, real audit persistence, or customer-visible rollout.

Candidate behavior cases:

- Missing or invalid `dbClient` fails closed according to the current contract.
- Lookup behavior, such as `findExistingDraftToCaseResult`, uses a parameterized query shape and safe organization/idempotency scope.
- Writer behavior, such as `recordDraftToCaseResult`, uses only the injected fake `dbClient.query` path.
- Duplicate, conflict, or no-row behavior is normalized without leaking SQL or raw rows.
- Thrown fake DB errors are sanitized.
- Results must not expose raw SQL, raw rows, token, secret, provider payload, phone, address, LINE identifiers, `field_service_reports`, or `finalAppointmentId` authority.

## Hard No-DB Boundaries

- No real DB connection.
- No `psql`.
- No SQL dry-run.
- No migration execution or dry-run.
- No `npm run db:migrate`.
- No `process.env` or `DATABASE_URL`.
- No app/server/listen startup.
- No smoke execution.
- No provider, LINE, SMS, email, or webhook sending.
- No real audit persistence.
- No customer-visible runtime rollout.

## Guardrails

- One Case has at most one formal Field Service Report.
- No second formal Field Service Report may be introduced.
- `field_service_reports.case_id` uniqueness must remain untouched.
- `finalAppointmentId` remains backend/system-owned except explicit admin override.
- Repair Intake draft-to-Case must not bypass Case creation rules.
- Organization isolation, permission, safe-deny, and audit boundaries remain mandatory.
- DB or migration execution requires separate explicit approval.

## Recommended Next Implementation Task

The next implementation task should be one unit-test-only patch around idempotency repository fake-client behavior.

Recommended future allowlist:

- `tests/repairIntake/repairIntakeIdempotencyRepository.unit.test.js`
- Optional task documentation file only, if PM requests it.

Source edits should remain out of scope unless a fake-client test proves an actual no-DB contract gap and PM explicitly allows one tiny source patch.

## Non-goals

- No source edits in Task1578.
- No test edits in Task1578.
- No DB.
- No migration.
- No smoke.
- No provider sending.
- No app/server/listen action.
- No AI/RAG/vector action.
- No billing or settlement action.
- No cleanup/reset/stash/revert action.
