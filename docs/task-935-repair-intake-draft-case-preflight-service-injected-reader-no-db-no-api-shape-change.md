# Task935 - Repair Intake Draft-to-Case Preflight Service / Injected Reader / No DB No API Shape Change

Status: completed locally.

## Scope

Task935 adds a small production runtime service for Repair Intake draft-to-Case preflight checks.

This service loads sanitized draft metadata through an injected reader and delegates eligibility decisions to Task934's `evaluateRepairIntakeDraftCaseEligibility`.

In scope:

- `src/repairIntake/repairIntakeDraftCasePreflightService.js`
- `tests/repairIntake/repairIntakeDraftCasePreflightService.unit.test.js`

Out of scope:

- Case creation;
- Case id assignment;
- `finalAppointmentId` inference or exposure;
- DB, SQL, psql, migration, schema, seed, fixture DB files, or `npm run db:migrate`;
- API route, controller, DTO, or OpenAPI shape changes;
- repository-backed reader / writer;
- default audit writer;
- audit persistence;
- provider integrations or LINE / SMS / App / email / webhook sending;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- admin frontend;
- smoke / shared runtime changes;
- Engineer Mobile Task921-Task933.

## Runtime Behavior

`createRepairIntakeDraftCasePreflightService({ draftReader, eligibilityEvaluator })` creates a dependency-injected service with one method:

```js
preflightDraftToCase(input)
```

The service accepts sanitized lookup context only:

- `draftId`
- `organizationId`
- optional `actorId`
- optional `requestId`

It passes only those fields to the injected reader.

The injected reader returns sanitized draft metadata. The service then delegates to the Task934 eligibility helper.

Returned envelope:

```js
{
  ok: boolean,
  action: 'repair_intake_draft_to_case_preflight',
  draftId: string | null,
  organizationId: string | null,
  eligible: boolean,
  status: 'eligible' | 'blocked' | 'needs_review',
  reasonCode: string,
  requiredActions: string[],
  caseCreationAllowed: boolean,
}
```

`caseCreationAllowed` is `true` only when Task934 eligibility returns `eligible: true`.

## Failure Safety

The service returns safe blocked envelopes for:

- missing `draftId`;
- missing `organizationId`;
- missing draft from reader;
- reader failure.

Reader failure does not expose raw error messages, stack traces, SQL, provider data, phone, address, or customer payload.

Missing or invalid `draftReader` is rejected at construction with a stable `draftReader_required` error.

## Sensitive Data Boundary

Happy-path fixtures and returned envelopes do not include raw phone, address, customer name, customer payload, raw payload, provider secret, SQL, stack trace, or `finalAppointmentId`.

The service does not mutate input.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCasePreflightService.unit.test.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCasePreflightService.js tests/repairIntake/repairIntakeDraftCasePreflightService.unit.test.js docs/task-935-repair-intake-draft-case-preflight-service-injected-reader-no-db-no-api-shape-change.md
git diff --check -- src/repairIntake/repairIntakeDraftCasePreflightService.js tests/repairIntake/repairIntakeDraftCasePreflightService.unit.test.js docs/task-935-repair-intake-draft-case-preflight-service-injected-reader-no-db-no-api-shape-change.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCasePreflightService.unit.test.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCasePreflightService.js tests/repairIntake/repairIntakeDraftCasePreflightService.unit.test.js docs/task-935-repair-intake-draft-case-preflight-service-injected-reader-no-db-no-api-shape-change.md`: PASS. No output because Task935 files are untracked.
- `git diff --check -- src/repairIntake/repairIntakeDraftCasePreflightService.js tests/repairIntake/repairIntakeDraftCasePreflightService.unit.test.js docs/task-935-repair-intake-draft-case-preflight-service-injected-reader-no-db-no-api-shape-change.md`: PASS.
- `git status --short`: PASS. Task935 files are local / uncommitted / untracked.
- Extra check: `node --test tests/repairIntake/*.js`: PASS.
