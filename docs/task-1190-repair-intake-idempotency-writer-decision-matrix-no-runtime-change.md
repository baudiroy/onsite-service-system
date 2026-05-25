# Task1190 - Repair Intake Idempotency Writer Decision Matrix / No Runtime Change

## Status

Completed locally. Not staged.

This docs-only decision matrix records proposed policy choices for a future `recordDraftToCaseResult(input)` implementation.

It does not implement writer behavior.

It does not modify source/runtime files, tests, migration SQL files, package files, routes, APIs, providers, admin files, AI, billing, repository writers, or DB behavior.

It does not perform git staging, commit, cleanup, revert, reset, stash, DB connection, SQL execution, migration dry-run, migration apply, `psql`, or `db:migrate`.

## Accepted Baseline

- Task1189 is accepted.
- Current idempotency repository read model is committed.
- Current idempotency repository contract is committed.
- `recordDraftToCaseResult` remains unsupported/fail-closed in the repository implementation.
- Migration 026 exists and defines `repair_intake_idempotency_records`, but no DB execution has occurred.

## Decision Matrix

| Option | Proposed decision | Risk | Required test coverage | Runtime allowed now | DB execution required now |
| --- | --- | --- | --- | --- | --- |
| insert-only behavior | Do not choose as the final default unless conflict failure is intentionally surfaced as a retry/manual-review result. | Duplicate submit attempts may turn into hard write failures instead of replay-safe behavior. | Unit test duplicate-key rejection sanitization and failure envelope mapping. | no | no |
| upsert-on-conflict behavior | Preferred future writer direction if it is backed by the migration 026 unique constraint and returns a sanitized existing/recorded result. | Incorrect conflict update could overwrite a completed replay result or mask mismatched fingerprints. | Unit tests for first write, same-key replay, mismatched fingerprint conflict, and no raw SQL/error leak. | no | no |
| do-nothing-on-conflict behavior | Acceptable only if followed by a safe read-back using the same organization/tenant/operation/idempotency scope. | Without read-back, caller may not know whether a result is replay-ready or still in progress. | Unit tests for conflict no-op plus read-back success, read-back not-found, and sanitized failure. | no | no |
| transaction-external behavior | Preferred final submit-flow boundary: caller injects a transaction-capable client and owns Case creation, audit writing, and idempotency write ordering. | Caller misuse could split related writes unless the contract is explicit. | Unit tests proving repository uses only injected client and does not start/commit/rollback transactions itself. | no | no |
| transaction-owned-by-repository behavior | Do not choose for this repository seam. Keep transaction orchestration outside the idempotency repository. | Repository would need broader DB authority and could couple idempotency to Case/audit persistence. | Static guard against transaction ownership keywords/imports if this option is rejected. | no | no |
| write-before-case-creation | Do not choose as the final completed-record behavior. It may be used only for a future explicit in-progress marker if policy accepts it. | A pre-case completed record can replay a Case result that does not exist yet or block valid retry. | Unit tests for in-progress marker semantics, expiration, and no replay-ready result before Case creation. | no | no |
| write-after-case-creation | Preferred direction for the completed replay record, inside a caller-owned transaction when final submit wiring is designed. | If record write fails after Case creation outside a transaction, retry may create duplicates or require manual reconciliation. | Unit tests for successful recorded result and sanitized post-case write failure; future integration tests for transaction boundary. | no | no |
| write-after-audit | Acceptable only if audit write is in the same caller-owned transaction and failure semantics are explicit. | Ordering ambiguity can leave audit without replay record or replay record without audit evidence. | Unit tests for call-order expectations at the application boundary before runtime wiring. | no | no |
| record-failure after case creation | Must fail closed with sanitized retry/manual-review output until transaction policy prevents split success. | Case may exist while idempotency replay is absent, creating duplicate-submit risk. | Unit tests for sanitized failure envelope, no stack/raw DB leak, and requiredActions including manual review. | no | no |
| replay-result payload shape | Store only a safe allow-list such as caseId, caseRef, draftId, organizationId, tenantId, requestId, actorId, status, submitted, reasonCode, requiredActions, metadata, and warnings. | Overbroad replay payload can persist customer PII, raw request data, LINE identity, or internal fields. | Unit/static tests for allowed fields and exclusion of phone/address/customer PII/LINE/finalAppointmentId/raw SQL/errors. | no | no |
| retention / expires-at behavior | Require explicit `expires_at` and `retention_until` policy before production wiring; synthetic writer may pass through sanitized values only after validation. | Missing retention policy can keep idempotency records longer than needed or expire replay protection too early. | Unit tests for accepted/omitted expiration fields and static docs guard for retention decision. | no | no |

## Recommended Decision

Prefer upsert-on-conflict or equivalent safe idempotent record behavior only if backed by the unique constraint from migration 026.

Prefer external transaction injection and caller-owned transaction boundary for the final submit flow.

For the next implementation task, allow isolated synthetic-`dbClient` writer implementation only, with no real DB execution and no app-flow wiring.

Do not decide production transaction orchestration in this task.

## Future Implementation Constraints

- Use injected `dbClient` only.
- Use parameterized SQL only.
- Do not import a global DB client.
- Do not read `process.env` or `DATABASE_URL`.
- Do not write raw request bodies.
- Do not write credentials, tokens, cookies, authorization headers, or secrets.
- Do not write phone, address, customer name, customer phone, customer PII, LINE global identity, or `finalAppointmentId`.
- Return sanitized record result only.
- Do not expose raw SQL, SQL params, raw DB errors, raw rows, or stack traces.
- Do not wire into application service flow until transaction decision is finalized.

## Future Bounded Task Proposal

Task1191 may implement `recordDraftToCaseResult` in `src/repairIntake/repairIntakeIdempotencyRepository.js` using synthetic-`dbClient` unit tests only.

Exact future allowed files:

- `src/repairIntake/repairIntakeIdempotencyRepository.js`
- `tests/repairIntake/repairIntakeIdempotencyRepository.unit.test.js`
- `tests/repairIntake/repairIntakeIdempotencyRepositoryBoundary.static.test.js`
- `docs/task-1191-repair-intake-idempotency-repository-writer-implementation-no-db-execution.md`

The future task must still forbid real DB execution, migration dry-run/apply, `psql`, `db:migrate`, route/API/provider/admin/AI/billing/package changes, and application-flow wiring unless separately authorized.

## Fail-Closed Rule

If transaction or failure semantics are unclear, writer implementation must remain blocked.

No DB execution or migration apply is authorized by this document.

No writer method source change is authorized by this document.

`recordDraftToCaseResult` must remain unsupported/fail-closed until PM assigns and accepts a future writer implementation task.

## Local Git Warning

`git diff --cached --name-only` must remain empty.

Task1190 remains untracked and unstaged.

Unrelated dirty and untracked files remain untouched.
