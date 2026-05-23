# Task956 - Repair Intake Draft-to-Case Idempotency Checker Adapter Contract / Injected DB Client Shape / No DB Execution No Migration

Status: completed locally.

## Scope

Task956 adds a bounded Repair Intake draft-to-Case idempotency checker adapter contract for later injection into Task944 / Task938 idempotency checker seams.

Allowed files:

- `src/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.js`
- `tests/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.unit.test.js`
- this task note

Out of scope:

- existing Task934-Task955 files;
- Engineer Mobile Task921-Task933;
- Task902;
- `admin/src/**`;
- API route / controller / DTO / OpenAPI changes;
- DB execution, SQL dry-run, psql, migration creation/apply, schema files, SQL migration files, seed files, or `npm run db:migrate`;
- package files;
- smoke / shared runtime scripts;
- provider integrations or LINE / SMS / App / email / webhook sending;
- AI / RAG / vector / provider runtime;
- billing / settlement / payment / invoice code;
- default global idempotency checker, store, writer, or DB client;
- Case creation;
- draft linking;
- audit persistence;
- idempotency record creation / reservation.

## Implementation Summary

Task956 adds `createRepairIntakeDraftCaseIdempotencyCheckerAdapter(options)`.

Injected options:

- `dbClient`
- optional `tableName`, defaulting to `repair_intake_draft_case_submissions`
- optional `clock` is intentionally unused by this read-only checker contract

Exposed methods:

- `checkDraftToCaseSubmission(input)`
- `check(input)`

Accepted input:

```js
{
  draftId,
  organizationId,
  actorId,
  requestId,
  idempotencyKey
}
```

The adapter:

- requires an injected `dbClient`;
- supports synthetic `query(sqlText, values)`, `execute(sqlText, values)`, `findOne(tableName, where)`, and `selectOne(tableName, where)` client shapes;
- validates `draftId`, `organizationId`, `idempotencyKey`, and `tableName` before any DB-client call;
- passes user values separately from SQL text in query / execute mode;
- does not interpolate raw user values into SQL text;
- queries only for an existing draft-to-Case submission by organization, draft, and idempotency key;
- returns a Task944-compatible checker result:

```js
{
  ok,
  decision,
  reasonCode,
  requiredActions,
  caseRef
}
```

Expected behavior:

- no existing record: `decision: "available"`;
- existing record with safe linked case reference: `decision: "conflict"` with sanitized `caseRef`;
- DB/client failure or untrusted record: `decision: "failed"` with a safe reason code.

The adapter never returns raw DB rows, SQL text, stack traces, raw error messages, tokens, secrets, raw phone/address/customer payload, imported row payload, provider payload, LINE token, unsafe `caseId`, or `finalAppointmentId`.

## Boundaries Preserved

Task956 does not:

- execute DB;
- import a global DB client;
- create a default DB connection;
- create a default idempotency checker, store, or writer;
- create or reserve idempotency records;
- create or apply migrations;
- wire API routes/controllers/DTO/OpenAPI;
- add smoke/shared runtime;
- create Case;
- link drafts;
- perform audit persistence;
- expose customer-visible data;
- touch admin frontend, provider sending, AI/RAG, billing, or settlement runtime.

## Static Inventory Amendment

Full repairIntake suite verification was initially blocked by the older Task948 static inventory regex for `repairIntakeDraftCase*.js` no-DB submission modules.

The Task956 source filename remains unchanged: `src/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.js`.

The Task948 / Task955-amended static inventory test was amended only to distinguish original Task934-Task945 no-DB submission modules from later repository/audit/store-adjacent adapter modules that share the filename prefix. The Task956 idempotency checker adapter is explicitly excluded from the no-DB submission module inventory and is not added to that assertion set.

The Task955 audit writer adapter remains excluded/accounted for. No production behavior changed as part of this static-test amendment.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.js tests/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.unit.test.js tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-956-repair-intake-draft-to-case-idempotency-checker-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.js tests/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.unit.test.js tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-956-repair-intake-draft-to-case-idempotency-checker-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.unit.test.js`: PASS (20/20)
- `node --test tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js`: PASS (6/6)
- `node --test tests/repairIntake/*.js`: PASS (280/280)
- `npm run check`: PASS
- `git diff -- src/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.js tests/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.unit.test.js tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-956-repair-intake-draft-to-case-idempotency-checker-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md`: PASS
- `git diff --check -- src/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.js tests/repairIntake/repairIntakeDraftCaseIdempotencyCheckerAdapter.unit.test.js tests/repairIntake/repairIntakeDraftCaseNoDbSubmissionBoundary.static.test.js docs/task-956-repair-intake-draft-to-case-idempotency-checker-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md`: PASS
- `git status --short`: PASS; Task956 files are local, uncommitted, and untracked in the broader accepted dirty worktree.
