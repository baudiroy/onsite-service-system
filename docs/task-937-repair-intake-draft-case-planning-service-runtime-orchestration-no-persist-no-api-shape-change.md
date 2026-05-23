# Task937 - Repair Intake Draft-to-Case Planning Service / Runtime Orchestration / No Persist No API Shape Change

Status: completed locally.

## Scope

Task937 adds a production runtime orchestration service that combines:

- sanitized draft lookup through an injected reader;
- Task934 eligibility evaluation;
- Task936 candidate building;

and returns a stable draft-to-Case planning envelope.

In scope:

- `src/repairIntake/repairIntakeDraftCasePlanningService.js`
- `tests/repairIntake/repairIntakeDraftCasePlanningService.unit.test.js`

Out of scope:

- Case persistence or Case creation;
- `caseId` assignment;
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

`createRepairIntakeDraftCasePlanningService({ draftReader, eligibilityEvaluator, candidateBuilder })` creates a dependency-injected service with one method:

```js
planDraftToCase(input)
```

Input is sanitized lookup context only:

- `draftId`
- `organizationId`
- optional `actorId`
- optional `requestId`

The service passes only those lookup fields to the injected reader.

Default composition:

- `eligibilityEvaluator`: Task934 `evaluateRepairIntakeDraftCaseEligibility`
- `candidateBuilder`: Task936 `buildRepairIntakeDraftCaseCandidate`

## Planning Envelope

The service returns:

```js
{
  ok: boolean,
  action: 'repair_intake_draft_to_case_plan',
  draftId: string | null,
  organizationId: string | null,
  eligible: boolean,
  status: 'eligible' | 'blocked' | 'needs_review',
  reasonCode: string,
  requiredActions: string[],
  caseCreationAllowed: boolean,
  candidateReady: boolean,
  caseCandidate: object | null,
}
```

Rules:

- `caseCreationAllowed` is `true` only when eligibility returns `eligible: true`.
- `candidateReady` is `true` only when Task936 candidate building returns `candidateReady: true`.
- `caseCandidate` is `null` unless both eligibility and candidate building pass.
- Reader failure returns a safe blocked envelope.
- Missing `draftId` or `organizationId` returns a safe blocked envelope before reader lookup.

## Sensitive Data Boundary

Returned envelopes never include raw phone, full address, customer raw payload, SQL, stack trace, provider payload, token, secret, `caseId`, or `finalAppointmentId`.

Unsafe raw draft fields are ignored by the final envelope and candidate.

## Implementation Boundary

The service calls only an injected reader and default pure helpers. It never imports or calls DB, repository, provider, audit, AI, billing, API, route, controller, or smoke/shared runtime modules.

It does not mutate input.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCasePlanningService.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCasePlanningService.js tests/repairIntake/repairIntakeDraftCasePlanningService.unit.test.js docs/task-937-repair-intake-draft-case-planning-service-runtime-orchestration-no-persist-no-api-shape-change.md
git diff --check -- src/repairIntake/repairIntakeDraftCasePlanningService.js tests/repairIntake/repairIntakeDraftCasePlanningService.unit.test.js docs/task-937-repair-intake-draft-case-planning-service-runtime-orchestration-no-persist-no-api-shape-change.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCasePlanningService.unit.test.js`: PASS.
- `node --test tests/repairIntake/*.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCasePlanningService.js tests/repairIntake/repairIntakeDraftCasePlanningService.unit.test.js docs/task-937-repair-intake-draft-case-planning-service-runtime-orchestration-no-persist-no-api-shape-change.md`: PASS. No output because Task937 files are untracked.
- `git diff --check -- src/repairIntake/repairIntakeDraftCasePlanningService.js tests/repairIntake/repairIntakeDraftCasePlanningService.unit.test.js docs/task-937-repair-intake-draft-case-planning-service-runtime-orchestration-no-persist-no-api-shape-change.md`: PASS.
- `git status --short`: PASS. Task937 files are local / uncommitted / untracked.
