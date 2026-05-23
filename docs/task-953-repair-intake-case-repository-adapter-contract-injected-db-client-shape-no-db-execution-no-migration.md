# Task953 - Repair Intake Case Repository Adapter Contract / Injected DB Client Shape / No DB Execution No Migration

Status: completed locally.

## Scope

Task953 adds a bounded Repair Intake Case repository adapter contract for later injection into Task950's repository case creator adapter.

Allowed files:

- `src/repairIntake/repairIntakeCaseRepositoryAdapter.js`
- `tests/repairIntake/repairIntakeCaseRepositoryAdapter.unit.test.js`
- this task note

Out of scope:

- existing Task934-Task952 files;
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
- default global repository, default DB client, or default ID generator;
- audit persistence;
- idempotency persistence / store;
- draft linking.

## Implementation Summary

Task953 adds `createRepairIntakeCaseRepositoryAdapter(options)`.

Injected options:

- `dbClient`
- `idGenerator`
- optional `tableName`, defaulting to `cases`
- optional `clock`

Exposed methods:

- `createCaseFromRepairIntakeCandidate(input)`
- `create(input)`

Accepted input:

```js
{
  command: {
    draftId,
    organizationId,
    actorId,
    requestId,
    idempotencyKey
  },
  caseCandidate: {
    sourceDraftId,
    organizationId,
    brandId,
    serviceProviderId,
    intakeSource,
    serviceType,
    priority,
    reporterRef,
    customerRef,
    billingContactRef,
    siteRef,
    issueSummaryRef,
    createdByActorId
  },
  tx
}
```

The direct `caseCandidate` shape is also accepted.

The adapter:

- requires an injected `dbClient`;
- requires an injected `idGenerator`;
- supports injected `tx` as the call-level client override;
- supports synthetic `query(sqlText, values)`, `execute(sqlText, values)`, and `insert(tableName, payload)` client shapes;
- validates `sourceDraftId`, `organizationId`, generated Case id, and optional command/candidate consistency before any DB-client call;
- validates `tableName` before any DB-client call;
- passes user values separately from SQL text in query / execute mode;
- does not interpolate raw user values into SQL text;
- inserts only a minimal Case draft record:

```js
{
  id,
  organization_id,
  source_repair_intake_draft_id,
  brand_id,
  service_provider_id,
  intake_source,
  service_type,
  priority,
  status,
  created_by_actor_id,
  created_at,
  request_id,
  idempotency_key
}
```

Successful output is compatible with Task939:

```js
{
  id,
  organizationId,
  sourceDraftId,
  status
}
```

The adapter never returns raw DB rows, SQL text, stack traces, raw error messages, tokens, secrets, raw phone/address/customer payload, or `finalAppointmentId`.

## Boundaries Preserved

Task953 does not:

- execute DB;
- import a global DB client;
- create a default DB connection;
- create a default ID generator;
- create or apply migrations;
- wire API routes/controllers/DTO/OpenAPI;
- add smoke/shared runtime;
- link the draft to Case;
- perform audit persistence;
- perform idempotency persistence;
- expose customer-visible data;
- touch admin frontend, provider sending, AI/RAG, billing, or settlement runtime.

## Verification

Commands:

```bash
node --test tests/repairIntake/repairIntakeCaseRepositoryAdapter.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeCaseRepositoryAdapter.js tests/repairIntake/repairIntakeCaseRepositoryAdapter.unit.test.js docs/task-953-repair-intake-case-repository-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md
git diff --check -- src/repairIntake/repairIntakeCaseRepositoryAdapter.js tests/repairIntake/repairIntakeCaseRepositoryAdapter.unit.test.js docs/task-953-repair-intake-case-repository-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md
git status --short
```

Current results:

- `node --test tests/repairIntake/repairIntakeCaseRepositoryAdapter.unit.test.js`: PASS (23/23)
- `node --test tests/repairIntake/*.js`: PASS (228/228)
- `npm run check`: PASS
- `git diff -- src/repairIntake/repairIntakeCaseRepositoryAdapter.js tests/repairIntake/repairIntakeCaseRepositoryAdapter.unit.test.js docs/task-953-repair-intake-case-repository-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md`: PASS
- `git diff --check -- src/repairIntake/repairIntakeCaseRepositoryAdapter.js tests/repairIntake/repairIntakeCaseRepositoryAdapter.unit.test.js docs/task-953-repair-intake-case-repository-adapter-contract-injected-db-client-shape-no-db-execution-no-migration.md`: PASS
- `git status --short`: PASS; Task953 files are local, uncommitted, and untracked in the broader accepted dirty worktree.
