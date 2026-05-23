# Task934 - Repair Intake Draft-to-Case Eligibility Runtime Guard / No DB No API Shape Change

Status: completed locally.

## Scope

Task934 adds a small production runtime guard for Repair Intake draft-to-Case promotion eligibility.

This is runtime source, not docs-only, but the runtime surface is intentionally narrow:

- pure helper only;
- no DB access;
- no repository or repository-backed writer;
- no API route, controller, DTO, or OpenAPI shape change;
- no Case creation;
- no provider sending;
- no LINE / SMS / App / email / webhook code;
- no AI / RAG / vector / provider runtime;
- no billing / settlement / payment / invoice code;
- no admin frontend;
- no smoke / shared runtime change.

Engineer Mobile Task921-Task933 remains closed / paused and is not reopened by this task.

## Implemented Files

- `src/repairIntake/repairIntakeDraftCaseEligibility.js`
- `tests/repairIntake/repairIntakeDraftCaseEligibility.unit.test.js`

## Runtime Behavior

`evaluateRepairIntakeDraftCaseEligibility(input)` accepts sanitized draft metadata and returns a stable envelope:

```js
{
  eligible: boolean,
  status: 'eligible' | 'blocked' | 'needs_review',
  reasonCode: string,
  requiredActions: string[],
}
```

The helper is deterministic, dependency-free, and does not mutate input.

It only evaluates whether metadata is safe enough for a future orchestration layer to continue toward Case creation. It does not create a Case, write audit logs, write DB records, call providers, expose customer data, or change any API response.

## Guard Decisions

The guard blocks or requires review when:

- draft metadata is missing;
- the draft is already linked to a formal Case;
- source is missing or unsupported;
- referral / handoff / service request has not been platform accepted;
- organization scope is missing;
- brand / service-provider / responsible organization context is missing;
- duplicate status is unresolved;
- duplicate status is confirmed duplicate;
- reporter / customer / billing contact separation is incomplete;
- import / staging source has not been accepted;
- human acceptance is missing.

The guard may return eligible only when sanitized metadata shows:

- supported intake source;
- organization scope;
- brand or service-provider context;
- no existing Case link;
- no unresolved or confirmed duplicate block;
- reporter / customer / billing contact roles are separated or reviewed;
- platform / human acceptance is present;
- import / staging acceptance is present when required.

## Sensitive Data Boundary

The helper does not require raw phone, address, customer name, raw customer payload, token, secret, LINE user id, provider payload, or AI payload fields.

Tests use sanitized metadata and assert no raw phone / address / customer payload fields are required by the happy-path fixture.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseEligibility.unit.test.js
git diff -- src/repairIntake/repairIntakeDraftCaseEligibility.js tests/repairIntake/repairIntakeDraftCaseEligibility.unit.test.js docs/task-934-repair-intake-draft-case-eligibility-runtime-guard-no-db-no-api-shape-change.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseEligibility.unit.test.js`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCaseEligibility.js tests/repairIntake/repairIntakeDraftCaseEligibility.unit.test.js docs/task-934-repair-intake-draft-case-eligibility-runtime-guard-no-db-no-api-shape-change.md`: PASS. No output because Task934 files are untracked.
- `git status --short`: PASS. Task934 files are local / uncommitted / untracked.
- Extra check: `npm run check`: PASS.
- Extra check: `git diff --check -- src/repairIntake/repairIntakeDraftCaseEligibility.js tests/repairIntake/repairIntakeDraftCaseEligibility.unit.test.js docs/task-934-repair-intake-draft-case-eligibility-runtime-guard-no-db-no-api-shape-change.md`: PASS.
