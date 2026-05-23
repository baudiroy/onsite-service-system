# Task936 - Repair Intake Draft-to-Case Candidate Builder / Pure Runtime Mapper / No DB No API Shape Change

Status: completed locally.

## Scope

Task936 adds a pure production runtime mapper that builds a sanitized Case creation candidate from sanitized Repair Intake draft metadata only after a Task935-style preflight result allows draft-to-Case progression.

In scope:

- `src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js`
- `tests/repairIntake/repairIntakeDraftCaseCandidateBuilder.unit.test.js`

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

`buildRepairIntakeDraftCaseCandidate(input)` accepts sanitized input:

```js
{
  draft,
  preflightResult,
  actorContext,
}
```

It returns a stable envelope:

```js
{
  ok: boolean,
  action: 'repair_intake_draft_to_case_candidate_build',
  candidateReady: boolean,
  reasonCode: string,
  requiredActions: string[],
  caseCandidate: object | null,
}
```

The builder creates a candidate only when `preflightResult.caseCreationAllowed === true`.

It returns safe blocked envelopes when:

- input is missing;
- preflight result is missing;
- preflight result is blocked, needs review, or otherwise not allowed;
- sanitized draft metadata is missing;
- organization scope is missing;
- required candidate metadata is incomplete.

## Candidate Shape

The candidate contains future-oriented sanitized references only:

```js
{
  sourceDraftId: string,
  organizationId: string,
  brandId: string | null,
  serviceProviderId: string | null,
  intakeSource: string,
  serviceType: string | null,
  priority: string | null,
  reporterRef: object | null,
  customerRef: object | null,
  billingContactRef: object | null,
  siteRef: object | null,
  issueSummaryRef: object | null,
  createdByActorId: string | null,
}
```

References are sanitized ids / refs only. The builder does not include full customer identity, phone number, full address, message body, raw imported row payload, SQL, stack trace, provider payload, token, secret, `caseId`, or `finalAppointmentId`.

## Implementation Boundary

The module is dependency-free and does not import DB, repository, provider, audit, AI, billing, API, route, controller, or smoke/shared runtime modules.

It does not mutate input.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseCandidateBuilder.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js tests/repairIntake/repairIntakeDraftCaseCandidateBuilder.unit.test.js docs/task-936-repair-intake-draft-case-candidate-builder-pure-runtime-mapper-no-db-no-api-shape-change.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js tests/repairIntake/repairIntakeDraftCaseCandidateBuilder.unit.test.js docs/task-936-repair-intake-draft-case-candidate-builder-pure-runtime-mapper-no-db-no-api-shape-change.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseCandidateBuilder.unit.test.js`: PASS.
- `node --test tests/repairIntake/*.js`: PASS.
- `npm run check`: PASS.
- `git diff -- src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js tests/repairIntake/repairIntakeDraftCaseCandidateBuilder.unit.test.js docs/task-936-repair-intake-draft-case-candidate-builder-pure-runtime-mapper-no-db-no-api-shape-change.md`: PASS. No output because Task936 files are untracked.
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js tests/repairIntake/repairIntakeDraftCaseCandidateBuilder.unit.test.js docs/task-936-repair-intake-draft-case-candidate-builder-pure-runtime-mapper-no-db-no-api-shape-change.md`: PASS.
- `git status --short`: PASS. Task936 files are local / uncommitted / untracked.
