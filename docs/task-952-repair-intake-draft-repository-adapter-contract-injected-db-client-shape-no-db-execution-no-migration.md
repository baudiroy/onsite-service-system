# Task952 - Repair Intake Draft Repository Adapter Contract / Injected DB Client Shape / No DB Execution No Migration

Status: completed locally.

## Scope

Task952 adds the first bounded Repair Intake draft repository adapter contract for later injection into Task950's repository case creator adapter.

Allowed files:

- `src/repairIntake/repairIntakeDraftRepositoryAdapter.js`
- `tests/repairIntake/repairIntakeDraftRepositoryAdapter.unit.test.js`
- this task note

Out of scope:

- existing Task934-Task951 files;
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
- default global repository or default DB client;
- audit persistence;
- idempotency persistence / store;
- Case creation.

## Implementation Summary

Task952 adds `createRepairIntakeDraftRepositoryAdapter(options)`.

Injected options:

- `dbClient`
- optional `tableName`, defaulting to `repair_intake_drafts`
- optional `clock`

Exposed methods:

- `markDraftLinkedToCase(input)`
- `markLinkedToCase(input)`

Accepted input:

```js
{
  draftId,
  organizationId,
  caseId,
  actorId,
  requestId,
  idempotencyKey,
  tx,
}
```

For Task950 compatibility, `caseRef.id` is also accepted as the Case id source when `caseId` is not present.

The adapter:

- requires an injected `dbClient`;
- supports injected `tx` as the call-level client override;
- supports synthetic `query(sqlText, values)`, `execute(sqlText, values)`, and `update(tableName, payload, where)` client shapes;
- validates `draftId`, `organizationId`, and Case id before any DB-client call;
- validates `tableName` before any DB-client call;
- passes user values separately from SQL text in query / execute mode;
- does not interpolate raw user values into SQL text;
- returns only a sanitized envelope:

```js
{
  ok,
  draftId,
  organizationId,
  caseId,
  status,
  reasonCode,
  requiredActions,
}
```

The adapter never returns raw DB rows, SQL text, stack traces, raw error messages, tokens, secrets, raw phone/address/customer payload, or `finalAppointmentId`.

## Boundaries Preserved

Task952 does not:

- execute DB;
- import a global DB client;
- create a default DB connection;
- create or apply migrations;
- wire API routes/controllers/DTO/OpenAPI;
- add smoke/shared runtime;
- perform Case creation;
- perform audit persistence;
- perform idempotency persistence;
- expose customer-visible data;
- touch admin frontend, provider sending, AI/RAG, billing, or settlement runtime.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeDraftRepositoryAdapter.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftRepositoryAdapter.js tests/repairIntake/repairIntakeDraftRepositoryAdapter.unit.test.js docs/task-952-repair-intake-draft-repository-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md
git diff --check -- src/repairIntake/repairIntakeDraftRepositoryAdapter.js tests/repairIntake/repairIntakeDraftRepositoryAdapter.unit.test.js docs/task-952-repair-intake-draft-repository-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeDraftRepositoryAdapter.unit.test.js`: PASS (18/18)
- `node --test tests/repairIntake/*.js`: PASS (205/205)
- `npm run check`: PASS
- `git diff -- src/repairIntake/repairIntakeDraftRepositoryAdapter.js tests/repairIntake/repairIntakeDraftRepositoryAdapter.unit.test.js docs/task-952-repair-intake-draft-repository-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md`: PASS
- `git diff --check -- src/repairIntake/repairIntakeDraftRepositoryAdapter.js tests/repairIntake/repairIntakeDraftRepositoryAdapter.unit.test.js docs/task-952-repair-intake-draft-repository-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md`: PASS
- `git status --short`: PASS; Task952 files are local, uncommitted, and untracked in the broader accepted dirty worktree.
